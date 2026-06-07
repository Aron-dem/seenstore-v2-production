import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { z } from "zod";
import { optionalAuth, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Mock reviews table (in production, this would be in the DB schema)
// For now, we'll store reviews in memory with a simple structure
const reviews: Array<{
  id: string;
  productId: number;
  userId?: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: Date;
}> = [];

const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100),
  comment: z.string().min(10).max(1000),
  userName: z.string().min(2).max(60),
  userEmail: z.string().email(),
});

// GET /api/products/:id/reviews — Get reviews for a product
router.get("/products/:id/reviews", async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const productReviews = reviews
      .filter(r => r.productId === productId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const avgRating = productReviews.length > 0
      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
      : 0;

    res.json({
      averageRating: parseFloat(avgRating as string),
      totalReviews: productReviews.length,
      reviews: productReviews,
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/products/:id/reviews — Create a review
router.post("/products/:id/reviews", optionalAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const payload = createReviewSchema.parse(req.body);

    const newReview = {
      id: `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      userId: req.user?.sub,
      userName: payload.userName,
      userEmail: payload.userEmail,
      rating: payload.rating,
      title: payload.title,
      comment: payload.comment,
      verified: !!req.user?.sub,
      helpful: 0,
      createdAt: new Date(),
    };

    reviews.push(newReview);
    res.status(201).json(newReview);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid review data", details: error.errors });
    }
    console.error("Review creation error:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// PATCH /api/reviews/:id/helpful — Mark review as helpful
router.patch("/reviews/:id/helpful", async (req, res) => {
  try {
    const review = reviews.find(r => r.id === req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    review.helpful += 1;
    res.json(review);
  } catch (error) {
    console.error("Review helpful error:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

export default router;
