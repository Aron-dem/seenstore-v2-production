import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import googleOAuthRouter from "./googleOAuth";
import meRouter from "./me";
import customOrdersRouter from "./customOrders";
import adminRouter from "./admin";
import productsRouter from "./products";
import messagesRouter from "./messages";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import seedRouter from "./seed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(googleOAuthRouter);
router.use(meRouter);
router.use(customOrdersRouter);
router.use(adminRouter);
router.use(productsRouter);
router.use(messagesRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(seedRouter);

export default router;