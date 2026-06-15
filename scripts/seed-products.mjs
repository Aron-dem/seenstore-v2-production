import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const sql = postgres(DATABASE_URL);

const BUCKET = "product-images";
const SHOP_DIR = "/tmp/shop_data/Shop";

// ── Ensure bucket exists ────────────────────────────────────────────────────
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Create bucket failed: ${error.message}`);
    console.log(`✅ Created bucket: ${BUCKET}`);
  } else {
    console.log(`✅ Bucket exists: ${BUCKET}`);
  }
}

// ── Upload a single image file ──────────────────────────────────────────────
async function uploadImage(localPath, storageName) {
  const buffer = fs.readFileSync(localPath);
  const mime = localPath.endsWith(".png") ? "image/png" : "image/jpeg";

  // Remove if already exists
  await supabase.storage.from(BUCKET).remove([storageName]);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageName, buffer, { contentType: mime, upsert: true });

  if (error) throw new Error(`Upload failed for ${storageName}: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storageName);
  console.log(`  📸 Uploaded: ${storageName}`);
  return publicUrl;
}

// ── Upload all images in a folder and return URLs ───────────────────────────
async function uploadProductImages(collection, productName, colorPath = null) {
  const season = collection === "Summer Collection" ? "summer" : "winter";
  const basePath = colorPath
    ? path.join(SHOP_DIR, collection, productName, colorPath)
    : path.join(SHOP_DIR, collection, productName);

  const urls = [];
  if (!fs.existsSync(basePath)) return urls;

  const files = fs.readdirSync(basePath)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .sort();

  for (const file of files) {
    const localPath = path.join(basePath, file);
    const colorPart = colorPath ? colorPath.toLowerCase().replace(/\s+/g, "-") + "-" : "";
    const storageName = `${season}/${productName.toLowerCase().replace(/\s+/g, "-")}/${colorPart}${file}`;
    const url = await uploadImage(localPath, storageName);
    urls.push(url);
  }
  return urls;
}

// ── Insert product into DB ──────────────────────────────────────────────────
async function insertProduct(p) {
  const result = await sql`
    INSERT INTO products (
      name, name_ar, description, description_ar,
      price, original_price, category, badge,
      sizes, colors, images,
      in_stock, season,
      created_at, updated_at
    ) VALUES (
      ${p.name}, ${p.nameAr}, ${p.description}, ${p.descriptionAr},
      ${p.price}, ${p.originalPrice ?? null}, ${p.category}, ${p.badge ?? null},
      ${p.sizes}, ${p.colors}, ${p.images},
      ${p.inStock}, ${p.season},
      NOW(), NOW()
    )
    ON CONFLICT DO NOTHING
    RETURNING id, name
  `;
  if (result[0]) {
    console.log(`  ✅ Inserted product: "${result[0].name}" (id=${result[0].id})`);
  } else {
    console.log(`  ⚠️  Product "${p.name}" already exists, skipped.`);
  }
}

// ── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 Starting product seed...\n");

  await ensureBucket();

  // ────────────────────────────────────────────────────────────────────────
  // 1. Essential Basic Tee  (Summer, T-Shirts)
  // ────────────────────────────────────────────────────────────────────────
  console.log("\n📦 Essential Basic Tee");
  const teeColors = ["Black", "Charcoal", "Dark Brown", "Maroon", "White"];
  const teeImages = [];
  for (const color of teeColors) {
    const urls = await uploadProductImages("Summer Collection", "Essential Basic Tee", color);
    teeImages.push(...urls);
  }

  await insertProduct({
    name: "Essential Basic Tee",
    nameAr: "تيشرت أساسي",
    description: "Your Everyday Essential. Clean, minimalist plain design with no distractions. Comfortable crew neck collar. Premium 100% Egyptian cotton fabric. Perfect for every occasion (Streetwear, Casual, Daily). Relaxed comfortable fit. Ideal for summer and fall layering.",
    descriptionAr: "تيشرت Essential Basic Tee — التيشرت الكلاسيكي الأساسي اللي مالوش حل. الأساس المثالي لأي خزانة ملابس. تصميم سادة نظيف وكلاسيكي بدون تفاصيل. ياقة دائرية مريحة. قماش 100% قطن مصري عالي الجودة. مناسب لكل المناسبات. قصة مريحة (Relaxed Fit).",
    price: 299,
    originalPrice: null,
    category: "t-shirts",
    badge: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: teeColors,
    images: teeImages,
    inStock: true,
    season: "summer",
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. 71 Years Free  (Winter, Hoodies)
  // ────────────────────────────────────────────────────────────────────────
  console.log("\n📦 71 Years Free");
  const ftImages = await uploadProductImages("Winter Collection", "71 Years Free", "Burgundy");

  await insertProduct({
    name: "71 Years Free",
    nameAr: "هودي ٧١ ييرز فري",
    description: "Wild Spirit Edition. Detailed wild horse head puff print design with fiery orange glowing eye accent. Classic serif '71 YEARS ∞ FEELING FREE.' typography. Luxurious burgundy colorway with vintage wash texture. Comfortable kangaroo front pocket. Modern oversized fit.",
    descriptionAr: "هودي 71 Years Free بتصميم رأس حصان Wild مع عين نارية متوهجة — تصميم يحمل رسالة الحرية والخفة. تصميم بتفاصيل دقيقة (Puff Print). عين الحصان بلون برتقالي ناري. نص '71 YEARS ∞ FEELING FREE' بخط Serif كلاسيكي. لون عنابي غامق فاخر. قصة واسعة (Oversized Fit).",
    price: 549,
    originalPrice: null,
    category: "hoodies",
    badge: "New",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Burgundy"],
    images: ftImages,
    inStock: true,
    season: "winter",
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Apple Pants  (Winter, Pants, SOLD OUT)
  // ────────────────────────────────────────────────────────────────────────
  console.log("\n📦 Apple Pants");
  const appleBlack = await uploadProductImages("Winter Collection", "Apple Pants", "Black");
  const appleGray  = await uploadProductImages("Winter Collection", "Apple Pants", "Gray");
  const appleImages = [...appleBlack, ...appleGray];

  await insertProduct({
    name: "Apple Pants",
    nameAr: "بنطلون أبل",
    description: "Smart Pocket Design. Specially designed front pocket for iPhone — easy access without removing. Additional back pocket for small items. Premium stretch fabric (Cotton/Spandex blend). Slim-fit cut that suits all body types. Perfect for winter — warm & wind-resistant.",
    descriptionAr: "بنطلون Apple Pants بتصميم ذكي ومبتكر — الجيب الأمامي مخصص بشكل مثالي لهاتف الأيفون. توصلك بسهولة من غير ما تطلعه. جيب خلفي إضافي. قماش فاخر (قطن/سباندكس) مرن ومريح. قص Slim Fit يليق بجميع المقاسات. مثالي للشتاء.",
    price: 449,
    originalPrice: null,
    category: "pants",
    badge: "Sold Out",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Gray", "White"],
    images: appleImages,
    inStock: false,
    season: "winter",
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. Matte Golden Horse  (Winter, Hoodies)
  // ────────────────────────────────────────────────────────────────────────
  console.log("\n📦 Matte Golden Horse");
  const mghImages = await uploadProductImages("Winter Collection", "Matte Golden Horse", "Charcoal");

  await insertProduct({
    name: "Matte Golden Horse",
    nameAr: "هودي ماتي جولدن هورس",
    description: "Herd Edition. Dynamic herd of 5 galloping horses design. Elegant matte gold gradient print. Classic serif 'MATTE GOLDEN HORSE.' typography. Elegant charcoal colorway with acid wash texture. Comfortable kangaroo front pocket. Modern oversized fit.",
    descriptionAr: "هودي Matte Golden Horse بتصميم قطيع من 5 خيول ذهبية تجري بحرية — تحفة فنية على التيشرت. طباعة Matte Gold متدرجة بأناقة. نص 'MATTE GOLDEN HORSE.' بخط Serif كلاسيكي. لون رمادي غامق أنيق مع Acid Wash texture. قصة واسعة (Oversized Fit).",
    price: 549,
    originalPrice: null,
    category: "hoodies",
    badge: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Charcoal"],
    images: mghImages,
    inStock: true,
    season: "winter",
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. Running Horse  (Winter, Hoodies)
  // ────────────────────────────────────────────────────────────────────────
  console.log("\n📦 Running Horse");
  const rhImages = await uploadProductImages("Winter Collection", "Running Horse", "Green");

  await insertProduct({
    name: "Running Horse",
    nameAr: "هودي رانينج هورس",
    description: "Water Splash Edition. Majestic horse galloping through water design. Detailed water splash & splatter effects around hooves. Classic serif 'A horse running through the water.' text. Elegant forest green premium colorway. Comfortable kangaroo front pocket. Modern oversized fit.",
    descriptionAr: "هودي Running Horse بتصميم حصان Majestic يجري في الماء مع تأثيرات رش مذهلة. تأثيرات رش الماء التفصيلية حول الحوافر. نص 'A horse running through the water' بخط Serif كلاسيكي. لون أخضر غامق أنيق وفاخر. جيب كنغر أمامي. قصة واسعة (Oversized Fit).",
    price: 549,
    originalPrice: null,
    category: "hoodies",
    badge: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Forest Green"],
    images: rhImages,
    inStock: true,
    season: "winter",
  });

  // ────────────────────────────────────────────────────────────────────────
  // 6. The Chosen Black One  (Winter, Hoodies)
  // ────────────────────────────────────────────────────────────────────────
  console.log("\n📦 The Chosen Black One");
  const tcboImages = await uploadProductImages("Winter Collection", "The Chosen Black One", "White");

  await insertProduct({
    name: "The Chosen Black One",
    nameAr: "هودي ذا تشوزن بلاك ون",
    description: "Premium Statement Piece. Powerful black stallion rearing up design. Classic serif 'THE CHOSEN BLACK ONE.' typography. High-quality screen print. Comfortable kangaroo front pocket. Premium fabric blend (80% Cotton / 20% Polyester). Modern oversized fit. Perfect for winter & casual streetwear.",
    descriptionAr: "هودي The Chosen Black One بتصميم حصان أسود جبّار يرتفع بقوة — رمز للحرية والقوة. نص 'THE CHOSEN BLACK ONE.' بخط Serif كلاسيكي. طباعة Screen Print عالية الجودة. قماش فاخر (قطن 80% / بوليستر 20%). قصة واسعة (Oversized Fit). مثالي للشتاء.",
    price: 549,
    originalPrice: null,
    category: "hoodies",
    badge: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White"],
    images: tcboImages,
    inStock: true,
    season: "winter",
  });

  // ── Done ───────────────────────────────────────────────────────────────
  console.log("\n🎉 All products seeded successfully!\n");
  await sql.end();
}

main().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
