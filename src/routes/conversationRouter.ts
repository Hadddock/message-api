import express from 'express';
import { postConversation } from '../controllers/conversationController';
import asyncHandler from 'express-async-handler';
import { checkAuthentication } from '../middleware/authentication';

const router = express.Router();

router.post(
  '/conversation',
  checkAuthentication,
  asyncHandler(postConversation)
);
export default router;
