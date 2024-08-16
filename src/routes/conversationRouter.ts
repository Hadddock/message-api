import express from 'express';
import {
  postConversation,
  getPreviews,
  postAddUsers,
  deleteUsersFromConversation,
  deleteLeaveConversation,
  deleteConversation,
  getConversation,
} from '../controllers/conversationController';
import asyncHandler from 'express-async-handler';
import { checkAuthentication } from '../middleware/authentication';
import {
  validatePostConversation,
  validateDeleteLeaveConversation,
  validateDeleteUsersFromConversation,
  validateAddUsers,
  validateDeleteConversation,
  validateGetConversation,
} from '../middleware/validators/conversationValidator';

const router = express.Router();

router.post(
  '/conversation/:conversation/users',
  checkAuthentication,
  validateAddUsers,
  asyncHandler(postAddUsers)
);

router.delete(
  '/conversation/:conversation',
  checkAuthentication,
  validateDeleteConversation,
  asyncHandler(deleteConversation)
);

router.delete(
  '/conversation/:conversation/users',
  checkAuthentication,
  validateDeleteUsersFromConversation,
  asyncHandler(deleteUsersFromConversation)
);

router.get(
  '/conversation/:conversation',
  checkAuthentication,
  validateGetConversation,
  asyncHandler(getConversation)
);

router.delete(
  '/conversation/:conversation/leave',
  checkAuthentication,
  validateDeleteLeaveConversation,
  asyncHandler(deleteLeaveConversation)
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
