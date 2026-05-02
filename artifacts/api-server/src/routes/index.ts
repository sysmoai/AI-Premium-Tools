import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import customersRouter from "./customers";
import ordersRouter from "./orders";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(customersRouter);
router.use(ordersRouter);
router.use(statsRouter);

export default router;
