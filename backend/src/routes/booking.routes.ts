import { Router } from "express";
import { creatBooking, cancelBooking, getMyBookings } from "../controllers/booking.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router()

router.post("/", creatBooking)
router.post("/cancel/:token", cancelBooking)
router.get("/", authenticate, getMyBookings)

export default router;