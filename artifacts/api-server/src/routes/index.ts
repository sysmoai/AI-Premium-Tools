import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import customersRouter from "./customers";
import ordersRouter from "./orders";
import statsRouter from "./stats";
import adminRouter from "./admin";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(customersRouter);
router.use(ordersRouter);
router.use(statsRouter);
router.use(adminRouter);
router.use(reviewsRouter);

export default router;
