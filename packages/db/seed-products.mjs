import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
const BUCKET_ID    = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
const SIDECAR      = "http://127.0.0.1:1106";
const SHOP_DIR     = "/tmp/shop_data/Shop";

if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");
if (!BUCKET_ID)    throw new Error("Missing DEFAULT_OBJECT_STORAGE_BUCKET_ID");

const sql = postgres(DATABASE_URL);

// ── Upload one image via Replit Object Storage sidecar ────────────────────────
async function uploadImage(localPath, objectName) {
  const mime = /\.png$/i.test(localPath) ? "image/png" : "image/jpeg";
  const fullName = `product-images/${objectName}`;

  // 1. Get a signed PUT URL from the sidecar
  const signRes = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: BUCKET_ID,
      object_name: fullName,
      method:      "PUT",
      expires_at:  new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }),
  });
  if (!signRes.ok) throw new Error(`Sign URL failed for ${fullName}: ${await signRes.text()}`);
  const { signed_url } = await signRes.json();

  // 2. Upload the file
  const buffer = fs.readFileSync(localPath);
  const upRes  = await fetch(signed_url, {
    method:  "PUT",
    headers: { "Content-Type": mime },
    body:    buffer,
  });
  if (!upRes.ok) throw new Error(`Upload failed for ${fullName}: ${await upRes.text()}`);

  // 3. Return a stable public-read URL
  const publicUrl = `https://storage.googleapis.com/${BUCKET_ID}/${fullName}`;
  console.log(`    📸 ${path.basename(localPath)}`);
  return publicUrl;
}

// ── Upload all images in a color folder ───────────────────────────────────────
async function uploadFolder(collection, productName, colorDir) {
  const season   = /summer/i.test(collection) ? "summer" : "winter";
  const basePath = path.join(SHOP_DIR, collection, productName, colorDir);
  if (!fs.existsSync(basePath)) { console.log(`    ⚠️  Folder not found: ${basePath}`); return []; }
  const files = fs.readdirSync(basePath).filter(f => /\.(jpg|jpeg|png)$/i.test(f)).sort();
  const urls  = [];
  for (const file of files) {
    const slug = `${season}/${productName.toLowerCase().replace(/\s+/g,"-")}/${colorDir.toLowerCase().replace(/\s+/g,"-")}-${file}`;
    urls.push(await uploadImage(path.join(basePath, file), slug));
  }
  return urls;
}

// ── Insert product via SQL ─────────────────────────────────────────────────────
async function insertProduct(p) {
  const [row] = await sql`
    INSERT INTO products
      (name, name_ar, description, description_ar,
       price, original_price, category, badge,
       sizes, colors, images, in_stock, season,
       created_at, updated_at)
    VALUES
      (${p.name}, ${p.nameAr}, ${p.description}, ${p.descriptionAr},
       ${p.price}, ${p.originalPrice ?? null}, ${p.category}, ${p.badge ?? null},
       ${p.sizes}, ${p.colors}, ${p.images}, ${p.inStock}, ${p.season},
       NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id, name
  `;
  if (row) console.log(`  ✅ Inserted: "${row.name}" (id=${row.id})`);
  else     console.log(`  ⚠️  "${p.name}" already exists, skipped.`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 Starting product seed…\n");
  console.log(`Bucket: ${BUCKET_ID}`);

  // 1. Essential Basic Tee — Summer / T-Shirts
  console.log("\n📦 Essential Basic Tee");
  const teeColors = ["Black", "Charcoal", "Dark Brown", "Maroon", "White"];
  const teeImages = [];
  for (const c of teeColors) teeImages.push(...await uploadFolder("Summer Collection", "Essential Basic Tee", c));
  await insertProduct({
    name: "Essential Basic Tee", nameAr: "تيشرت أساسي",
    description: "Your Everyday Essential. Clean minimalist plain design. Comfortable crew neck collar. Premium 100% Egyptian cotton. Perfect for Streetwear, Casual, Daily. Relaxed fit. Ideal for summer.",
    descriptionAr: "التيشرت الكلاسيكي الأساسي اللي مالوش حل. تصميم سادة نظيف بدون تفاصيل. ياقة دائرية مريحة. قماش 100% قطن مصري عالي الجودة. مناسب لكل المناسبات. قصة مريحة (Relaxed Fit).",
    price: 299, originalPrice: null, category: "t-shirts", badge: null,
    sizes: ["S","M","L","XL","XXL"], colors: teeColors, images: teeImages, inStock: true, season: "summer",
  });

  // 2. 71 Years Free — Winter / Hoodies
  console.log("\n📦 71 Years Free");
  const ftImages = await uploadFolder("Winter Collection", "71 Years Free", "Burgundy");
  await insertProduct({
    name: "71 Years Free", nameAr: "هودي ٧١ ييرز فري",
    description: "Wild Spirit Edition. Wild horse head puff print with fiery orange glowing eye. '71 YEARS ∞ FEELING FREE.' serif typography. Burgundy vintage wash. Kangaroo pocket. Oversized fit.",
    descriptionAr: "هودي بتصميم رأس حصان Wild مع عين نارية برتقالية. طباعة Puff Print بتفاصيل دقيقة. نص '71 YEARS ∞ FEELING FREE' بخط Serif. لون عنابي غامق مع Vintage Wash. جيب كنغر. قصة Oversized.",
    price: 549, originalPrice: null, category: "hoodies", badge: "New",
    sizes: ["S","M","L","XL","XXL"], colors: ["Burgundy"], images: ftImages, inStock: true, season: "winter",
  });

  // 3. Apple Pants — Winter / Pants / Sold Out
  console.log("\n📦 Apple Pants");
  const apImages = [
    ...await uploadFolder("Winter Collection", "Apple Pants", "Black"),
    ...await uploadFolder("Winter Collection", "Apple Pants", "Gray"),
  ];
  await insertProduct({
    name: "Apple Pants", nameAr: "بنطلون أبل",
    description: "Smart Pocket Design. Front pocket specially designed for iPhone. Extra back pocket. Premium Cotton/Spandex blend. Slim-fit. Warm & wind-resistant for winter.",
    descriptionAr: "بنطلون بجيب أمامي مخصص لهاتف الأيفون — توصلك بسهولة. جيب خلفي إضافي. قماش فاخر (قطن/سباندكس) مرن. قص Slim Fit يليق بجميع المقاسات. مثالي للشتاء.",
    price: 449, originalPrice: null, category: "pants", badge: "Sold Out",
    sizes: ["S","M","L","XL"], colors: ["Black","Gray","White"], images: apImages, inStock: false, season: "winter",
  });

  // 4. Matte Golden Horse — Winter / Hoodies
  console.log("\n📦 Matte Golden Horse");
  const mghImages = await uploadFolder("Winter Collection", "Matte Golden Horse", "Charcoal");
  await insertProduct({
    name: "Matte Golden Horse", nameAr: "هودي ماتي جولدن هورس",
    description: "Herd Edition. 5 galloping horses dynamic design. Matte gold gradient print. 'MATTE GOLDEN HORSE.' serif. Charcoal acid wash. Kangaroo pocket. Oversized fit.",
    descriptionAr: "تصميم قطيع من 5 خيول ذهبية. طباعة Matte Gold متدرجة. نص 'MATTE GOLDEN HORSE.' بخط Serif. لون رمادي غامق مع Acid Wash. جيب كنغر. قصة Oversized.",
    price: 549, originalPrice: null, category: "hoodies", badge: null,
    sizes: ["S","M","L","XL","XXL"], colors: ["Charcoal"], images: mghImages, inStock: true, season: "winter",
  });

  // 5. Running Horse — Winter / Hoodies
  console.log("\n📦 Running Horse");
  const rhImages = await uploadFolder("Winter Collection", "Running Horse", "Green");
  await insertProduct({
    name: "Running Horse", nameAr: "هودي رانينج هورس",
    description: "Water Splash Edition. Majestic horse galloping through water. Splash & splatter effects around hooves. 'A horse running through the water.' serif. Forest green. Kangaroo pocket. Oversized fit.",
    descriptionAr: "تصميم حصان يجري في الماء مع تأثيرات رش مذهلة. نص 'A horse running through the water.' بخط Serif. لون أخضر غامق فاخر. جيب كنغر. قصة Oversized.",
    price: 549, originalPrice: null, category: "hoodies", badge: null,
    sizes: ["S","M","L","XL","XXL"], colors: ["Forest Green"], images: rhImages, inStock: true, season: "winter",
  });

  // 6. The Chosen Black One — Winter / Hoodies
  console.log("\n📦 The Chosen Black One");
  const tcboImages = await uploadFolder("Winter Collection", "The Chosen Black One", "White");
  await insertProduct({
    name: "The Chosen Black One", nameAr: "هودي ذا تشوزن بلاك ون",
    description: "Premium Statement Piece. Black stallion rearing up. 'THE CHOSEN BLACK ONE.' serif. High-quality screen print. 80% Cotton / 20% Polyester. Kangaroo pocket. Oversized fit. Perfect for winter streetwear.",
    descriptionAr: "تصميم حصان أسود جبّار يرتفع بقوة. نص 'THE CHOSEN BLACK ONE.' بخط Serif. طباعة Screen Print. قماش فاخر 80% قطن / 20% بوليستر. جيب كنغر. قصة Oversized.",
    price: 549, originalPrice: null, category: "hoodies", badge: null,
    sizes: ["S","M","L","XL","XXL"], colors: ["White"], images: tcboImages, inStock: true, season: "winter",
  });

  console.log("\n🎉 All products seeded successfully!\n");
  await sql.end();
}

main().catch(err => { console.error("❌ Seed failed:", err.message); process.exit(1); });
