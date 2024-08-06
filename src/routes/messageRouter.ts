import express from 'express';
import { postMessage, deleteMessage } from '../controllers/messageController';
import asyncHandler from 'express-async-handler';
import { checkAuthentication } from '../middleware/authentication';
import {
  validateDeleteMessage,
  validatePostMessage,
} from '../middleware/validators/messageValidator';

const router = express.Router();
router.delete(
  '/conversation/:conversation/message/:message',
  checkAuthentication,
  validateDeleteMessage,
  asyncHandler(deleteMessage)
);

router.post(
  '/conversation/:conversation/message',
  checkAuthentication,
  validatePostMessage,
  asyncHandler(postMessage)
);
export default router;
