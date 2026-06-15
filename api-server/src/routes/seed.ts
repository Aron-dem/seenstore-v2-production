import { Router, type IRouter } from "express";
import fs from "node:fs";
import path from "node:path";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";

const router: IRouter = Router();
const SHOP_DIR = "/tmp/shop_data/Shop";
const BUCKET_ID = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"] ?? "";
const REPLIT_SIDECAR = "http://127.0.0.1:1106";

// ── Upload a local image file via sidecar presigned URL ───────────────────────
async function uploadImage(localPath: string, objectName: string): Promise<string> {
  const mime = /\.png$/i.test(localPath) ? "image/png" : "image/jpeg";

  const signRes = await fetch(`${REPLIT_SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: BUCKET_ID,
      object_name: objectName,
      method: "PUT",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
  });
  const signText = await signRes.text();
  if (!signRes.ok) throw new Error(`Sign URL failed (${signRes.status}): ${signText}`);
  const { signed_url } = JSON.parse(signText) as { signed_url: string };
  if (!signed_url) throw new Error(`No signed_url: ${signText}`);

  const buffer = fs.readFileSync(localPath);
  const upRes  = await fetch(signed_url, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: buffer,
  });
  if (!upRes.ok) throw new Error(`Upload PUT failed (${upRes.status})`);
  return `https://storage.googleapis.com/${BUCKET_ID}/${objectName}`;
}

// ── Upload all images in a color folder ───────────────────────────────────────
async function uploadFolder(collection: string, productName: string, colorDir: string): Promise<string[]> {
  const basePath = path.join(SHOP_DIR, collection, productName, colorDir);
  if (!fs.existsSync(basePath)) return [];
  const files = fs.readdirSync(basePath).filter(f => /\.(jpg|jpeg|png)$/i.test(f)).sort();
  const urls: string[] = [];
  for (const f of files) {
    const slug = `product-images/${productName.toLowerCase().replace(/\s+/g, "-")}/${colorDir.toLowerCase().replace(/\s+/g, "-")}-${f}`;
    urls.push(await uploadImage(path.join(basePath, f), slug));
  }
  return urls;
}

// ── Seed route ────────────────────────────────────────────────────────────────
router.post("/seed-products", async (_req, res) => {
  const log: string[] = [];
  const say = (msg: string) => { log.push(msg); console.log("[SEED]", msg); };

  // Check if uploads work
  let uploadWorking = false;
  if (BUCKET_ID) {
    try {
      const testRes = await fetch(`${REPLIT_SIDECAR}/object-storage/signed-object-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket_name: BUCKET_ID, object_name: "test", method: "PUT", expires_at: new Date(Date.now() + 60000).toISOString() }),
      });
      const txt = await testRes.text();
      say(`Storage sidecar: status=${testRes.status}`);
      uploadWorking = testRes.ok && txt.includes("signed_url");
    } catch (e: any) { say(`Storage sidecar error: ${e.message}`); }
  }

  const tryUploadFolder = async (col: string, prod: string, color: string): Promise<string[]> => {
    if (!uploadWorking) return [];
    try { return await uploadFolder(col, prod, color); }
    catch (e: any) { say(`  ⚠️ ${e.message}`); uploadWorking = false; return []; }
  };

  try {
    // 1. Essential Basic Tee — Summer / T-Shirts
    say("Processing Essential Basic Tee…");
    const teeColors = ["Black", "Charcoal", "Dark Brown", "Maroon", "White"];
    const teeImages: string[] = [];
    for (const c of teeColors) teeImages.push(...await tryUploadFolder("Summer Collection", "Essential Basic Tee", c));
    await db.insert(productsTable).values({
      name: "Essential Basic Tee", nameAr: "تيشرت أساسي",
      description: "Your Everyday Essential. Clean minimalist plain design. Comfortable crew neck collar. Premium 100% Egyptian cotton. Relaxed fit. Perfect for Streetwear, Casual, Daily.",
      descriptionAr: "التيشرت الكلاسيكي الأساسي اللي مالوش حل. تصميم سادة نظيف بدون تفاصيل. ياقة دائرية مريحة. قماش 100% قطن مصري عالي الجودة. قصة مريحة (Relaxed Fit).",
      price: 299, originalPrice: null, category: "t-shirts", badge: null,
      sizes: ["S","M","L","XL","XXL"], colors: teeColors, images: teeImages, inStock: true, season: "summer",
    }).onConflictDoNothing();
    say(`  ✅ Essential Basic Tee (${teeImages.length} images)`);

    // 2. 71 Years Free — Winter / Hoodies
    say("Processing 71 Years Free…");
    const ftImages = await tryUploadFolder("Winter Collection", "71 Years Free", "Burgundy");
    await db.insert(productsTable).values({
      name: "71 Years Free", nameAr: "هودي ٧١ ييرز فري",
      description: "Wild Spirit Edition. Wild horse head puff print with fiery orange glowing eye. 71 YEARS FEELING FREE. Burgundy vintage wash. Kangaroo pocket. Oversized fit.",
      descriptionAr: "هودي بتصميم رأس حصان Wild مع عين نارية برتقالية. طباعة Puff Print. نص 71 YEARS FEELING FREE. لون عنابي Vintage Wash. جيب كنغر. قصة Oversized.",
      price: 549, originalPrice: null, category: "hoodies", badge: "New",
      sizes: ["S","M","L","XL","XXL"], colors: ["Burgundy"], images: ftImages, inStock: true, season: "winter",
    }).onConflictDoNothing();
    say(`  ✅ 71 Years Free (${ftImages.length} images)`);

    // 3. Apple Pants — Winter / Pants
    say("Processing Apple Pants…");
    const apImages = [
      ...await tryUploadFolder("Winter Collection", "Apple Pants", "Black"),
      ...await tryUploadFolder("Winter Collection", "Apple Pants", "Gray"),
    ];
    await db.insert(productsTable).values({
      name: "Apple Pants", nameAr: "بنطلون أبل",
      description: "Smart Pocket Design. Front pocket specially designed for iPhone. Extra back pocket. Premium Cotton/Spandex blend. Slim-fit. Warm & wind-resistant for winter.",
      descriptionAr: "بنطلون بجيب أمامي مخصص لهاتف الأيفون. جيب خلفي إضافي. قماش فاخر (قطن/سباندكس) مرن. قص Slim Fit. مثالي للشتاء.",
      price: 449, originalPrice: null, category: "pants", badge: "Sold Out",
      sizes: ["S","M","L","XL"], colors: ["Black","Gray","White"], images: apImages, inStock: false, season: "winter",
    }).onConflictDoNothing();
    say(`  ✅ Apple Pants (${apImages.length} images)`);

    // 4. Matte Golden Horse — Winter / Hoodies
    say("Processing Matte Golden Horse…");
    const mghImages = await tryUploadFolder("Winter Collection", "Matte Golden Horse", "Charcoal");
    await db.insert(productsTable).values({
      name: "Matte Golden Horse", nameAr: "هودي ماتي جولدن هورس",
      description: "Herd Edition. 5 galloping horses dynamic design. Matte gold gradient print. MATTE GOLDEN HORSE. Charcoal acid wash. Kangaroo pocket. Oversized fit.",
      descriptionAr: "تصميم قطيع من 5 خيول ذهبية. طباعة Matte Gold متدرجة. نص MATTE GOLDEN HORSE. لون رمادي Acid Wash. جيب كنغر. قصة Oversized.",
      price: 549, originalPrice: null, category: "hoodies", badge: null,
      sizes: ["S","M","L","XL","XXL"], colors: ["Charcoal"], images: mghImages, inStock: true, season: "winter",
    }).onConflictDoNothing();
    say(`  ✅ Matte Golden Horse (${mghImages.length} images)`);

    // 5. Running Horse — Winter / Hoodies
    say("Processing Running Horse…");
    const rhImages = await tryUploadFolder("Winter Collection", "Running Horse", "Green");
    await db.insert(productsTable).values({
      name: "Running Horse", nameAr: "هودي رانينج هورس",
      description: "Water Splash Edition. Majestic horse galloping through water. Splash & splatter effects. Forest green. Kangaroo pocket. Oversized fit.",
      descriptionAr: "تصميم حصان يجري في الماء مع تأثيرات رش مذهلة. لون أخضر غامق فاخر. جيب كنغر. قصة Oversized.",
      price: 549, originalPrice: null, category: "hoodies", badge: null,
      sizes: ["S","M","L","XL","XXL"], colors: ["Forest Green"], images: rhImages, inStock: true, season: "winter",
    }).onConflictDoNothing();
    say(`  ✅ Running Horse (${rhImages.length} images)`);

    // 6. The Chosen Black One — Winter / Hoodies
    say("Processing The Chosen Black One…");
    const tcboImages = await tryUploadFolder("Winter Collection", "The Chosen Black One", "White");
    await db.insert(productsTable).values({
      name: "The Chosen Black One", nameAr: "هودي ذا تشوزن بلاك ون",
      description: "Premium Statement Piece. Black stallion rearing up. THE CHOSEN BLACK ONE. High-quality screen print. 80% Cotton / 20% Polyester. Kangaroo pocket. Oversized fit.",
      descriptionAr: "تصميم حصان أسود جبّار يرتفع بقوة. طباعة Screen Print. قماش 80% قطن / 20% بوليستر. جيب كنغر. قصة Oversized.",
      price: 549, originalPrice: null, category: "hoodies", badge: null,
      sizes: ["S","M","L","XL","XXL"], colors: ["White"], images: tcboImages, inStock: true, season: "winter",
    }).onConflictDoNothing();
    say(`  ✅ The Chosen Black One (${tcboImages.length} images)`);

    res.json({ success: true, uploadWorking, log });
  } catch (err: any) {
    say(`❌ Error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message, log });
  }
});

export default router;
