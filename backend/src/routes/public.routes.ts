import {Router} from 'express';
import { getPublicEventType } from '../controllers/public.controller';


const router = Router()

router.get("/:username/:slug", getPublicEventType)

export default router