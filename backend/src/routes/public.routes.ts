import {Router} from 'express';
import { getPublicEventType, getUserEventTypes } from '../controllers/public.controller';


const router = Router()

router.get("/:username", getUserEventTypes)
router.get("/:username/:slug", getPublicEventType)

export default router