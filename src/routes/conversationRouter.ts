import express from 'express';
import {
  postConversation,
  getPreviews,
  postAddUsers,
  deleteUsersFromConversation,
} from '../controllers/conversationController';
import asyncHandler from 'express-async-handler';
import { checkAuthentication } from '../middleware/authentication';
import {
  validatePostConversation,
  validateDeleteUsersFromConversation,
  validateAddUsers,
} from '../middleware/validators/conversationValidator';

const router = express.Router();

router.post(
  '/conversation/:conversation/users',
  checkAuthentication,
  validateAddUsers,
  asyncHandler(postAddUsers)
);

router.delete(
  '/conversation/:conversation/users',
  checkAuthentication,
  validateDeleteUsersFromConversation,
  asyncHandler(deleteUsersFromConversation)
);

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
