import {Router} from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createEventType, deleteEvent, getEventType, getEventTypeById, updateEventType } from '../controllers/eventType.controller';

const router = Router()


router.use(authenticate)

router.post("/", createEventType)
router.get("/", getEventType)
router.get("/:id", getEventTypeById)
router.post("/:id", updateEventType)
router.delete("/:id", deleteEvent)


export default router