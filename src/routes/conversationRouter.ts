import express from 'express';
import {
  postConversation,
  getPreviews,
  postAddUsers,
  deleteUsersFromConversation,
  deleteLeaveConversation,
  getConversationMessages,
  deleteConversation,
  getConversation,
  postReadConversation,
  putRenameConversation,
} from '../controllers/conversationController';
import asyncHandler from 'express-async-handler';
import { checkAuthentication } from '../middleware/authentication';
import {
  validatePostConversation,
  validateDeleteLeaveConversation,
  validateDeleteUsersFromConversation,
  validateAddUsers,
  validateGetConversationMessages,
  validateDeleteConversation,
  validateGetConversation,
  validatePutRenameConversation,
  validatePostReadConversation,
} from '../middleware/validators/conversationValidator';

const router = express.Router();

router.post(
  '/conversation/:conversation/users',
  checkAuthentication,
  validateAddUsers,
  asyncHandler(postAddUsers)
);

router.put(
  '/conversation/:conversation/rename',
  checkAuthentication,
  validatePutRenameConversation,
  asyncHandler(putRenameConversation)
);

router.get(
  '/conversation/:conversation/messages',
  checkAuthentication,
  validateGetConversationMessages,
  asyncHandler(getConversationMessages)
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

router.post(
  '/conversation/:conversation/read',
  checkAuthentication,
  validatePostReadConversation,
  asyncHandler(postReadConversation)
);

export default router;
