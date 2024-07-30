import express from 'express';
import {
  postConversation,
  getPreviews,
} from '../controllers/conversationController';
import asyncHandler from 'express-async-handler';
import { checkAuthentication } from '../middleware/authentication';
import { validatePostConversation } from '../middleware/validators/conversationValidator';

const router = express.Router();

router.post(
  '/conversation',
  checkAuthentication,
  validatePostConversation,
  asyncHandler(postConversation)
);

router.get(
  '/conversations/previews',
  checkAuthentication,
  asyncHandler(getPreviews)
);
export default router;
