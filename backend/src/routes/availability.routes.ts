import { Router } from "express";
import { getAvailabilty } from "../controllers/availability.controller";

const router = Router()

router.get("/:eventTypeId", getAvailabilty)


export default router