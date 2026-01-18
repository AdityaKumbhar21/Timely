import {Router} from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createEventType, deleteEvent, getEventType, getEventTypeById, updateEventType } from '../controllers/eventType.controller';
import { getAvailabilityRules, setAvailabilityRules } from '../controllers/availability.controller';

const router = Router()


router.use(authenticate)

router.post("/", createEventType)
router.get("/", getEventType)
router.get("/:id", getEventTypeById)
router.put("/:id", updateEventType)
router.delete("/:id", deleteEvent)

// Availability rules routes
router.get("/:id/availability", getAvailabilityRules)
router.put("/:id/availability", setAvailabilityRules)


export default router