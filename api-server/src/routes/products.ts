import { Router, type IRouter } from "express";
import { eq, and, lte, gte, desc, asc } from "drizzle-orm";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";

const router: IRouter = Router();

// GET /api/products — public product listing with optional filters
router.get("/products", async (req, res) => {
  const category  = req.query["category"]  as string | undefined;
  const maxPrice  = req.query["maxPrice"]  ? parseInt(req.query["maxPrice"] as string, 10) : undefined;
  const minPrice  = req.query["minPrice"]  ? parseInt(req.query["minPrice"] as string, 10) : undefined;
  const inStock   = req.query["inStock"]   === "true" ? true : req.query["inStock"] === "false" ? false : undefined;
  const sortBy    = req.query["sort"]      as string | undefined;
  const season    = req.query["season"]    as string | undefined;
  const q         = (req.query["q"] as string | undefined)?.trim().toLowerCase();
  const limit     = req.query["limit"]
    ? Math.min(50, Math.max(1, parseInt(req.query["limit"] as string, 10) || 50))
    : undefined;

  let query = db.select().from(productsTable) as any;

  const conditions: any[] = [];
  if (category) conditions.push(eq(productsTable.category, category));
  if (season)   conditions.push(eq(productsTable.season, season));
  if (maxPrice !== undefined && !isNaN(maxPrice)) conditions.push(lte(productsTable.price, maxPrice));
  if (minPrice !== undefined && !isNaN(minPrice)) conditions.push(gte(productsTable.price, minPrice));
  if (inStock !== undefined) conditions.push(eq(productsTable.inStock, inStock));

  if (conditions.length > 0) query = query.where(and(...conditions));

  if (sortBy === "price_asc")  query = query.orderBy(asc(productsTable.price));
  else if (sortBy === "price_desc") query = query.orderBy(desc(productsTable.price));
  else query = query.orderBy(desc(productsTable.createdAt));

  let products = await query;

  if (q) {
    products = products.filter((product: any) => {
      const haystack = [product.name, product.nameAr, product.description, product.descriptionAr, product.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (limit) products = products.slice(0, limit);

  res.json({ products });
});

// GET /api/products/:id/related — related products prioritised by same category + season
router.get("/products/:id/related", async (req, res) => {
  const id = parseInt(req.params["id"]!, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product id" }); return; }

  const [currentProduct] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!currentProduct) { res.status(404).json({ error: "Product not found" }); return; }

  const allProducts = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(24);

  const related = allProducts
    .filter((product) => product.id !== id)
    .sort((a, b) => {
      const score = (product: typeof a) => {
        let value = 0;
        if (product.category === currentProduct.category) value += 3;
        if (product.season && product.season === currentProduct.season) value += 2;
        if (product.inStock) value += 1;
        return value;
      };
        return score(b) - score(a);
    })
    .slice(0, 4);

  res.json({ products: related });
});

// GET /api/products/:id — single product
router.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  res.json({ product });
});

export default router;
