import express from 'express';
import { postConversation } from '../controllers/conversationController';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.post('/conversation', asyncHandler(postConversation));
export default router;
