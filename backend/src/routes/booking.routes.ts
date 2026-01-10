import { Router } from "express";
import { creatBooking } from "../controllers/booking.controller";

const router = Router()


router.post("/", creatBooking)

export default router;