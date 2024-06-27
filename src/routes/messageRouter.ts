import express from 'express';
import { postMessage } from '../controllers/messageController';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.post('/conversation/:conversation/message', asyncHandler(postMessage));
export default router;
