import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Map product name → local image filenames in public/images/
const PRODUCT_IMAGES: Record<string, string[]> = {
  "Essential Basic Tee": [
    "essential-basic-tee-black-01.jpg",
    "essential-basic-tee-charcoal-01.jpg",
    "essential-basic-tee-dark-brown-01.jpg",
    "essential-basic-tee-maroon-01.jpg",
    "essential-basic-tee-white-01.jpg",
  ],
  "71 Years Free":       ["71-years-free-01.jpg", "71-years-free-02.jpg"],
  "Apple Pants":         ["apple-pants-01.jpg","apple-pants-02.jpg","apple-pants-03.jpg",
                          "apple-pants-04.jpg","apple-pants-05.jpg","apple-pants-06.jpg",
                          "apple-pants-07.jpg","apple-pants-08.jpg","apple-pants-09.jpg"],
  "Matte Golden Horse":  ["matte-golden-horse-01.jpg","matte-golden-horse-02.jpg"],
  "Running Horse":       ["running-horse-01.jpg","running-horse-02.jpg"],
  "The Chosen Black One":["the-chosen-black-one-01.jpg","the-chosen-black-one-02.jpg"],
};

router.post("/seed-products", async (_req, res) => {
  const log: string[] = [];
  const say = (msg: string) => { log.push(msg); console.log("[SEED]", msg); };

  try {
    for (const [name, files] of Object.entries(PRODUCT_IMAGES)) {
      const images = files.map(f => `/images/${f}`);
      await db.update(productsTable)
        .set({ images, updatedAt: new Date() })
        .where(eq(productsTable.name, name));
      say(`✅ "${name}" → ${images.length} images`);
    }
    res.json({ success: true, log });
  } catch (err: any) {
    say(`❌ ${err.message}`);
    res.status(500).json({ success: false, error: err.message, log });
  }
});

export default router;
