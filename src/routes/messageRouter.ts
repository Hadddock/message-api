import express from 'express';
import { postMessage } from '../controllers/messageController';
import asyncHandler from 'express-async-handler';
import { checkAuthentication } from '../middleware/authentication';
import { validatePostMessage } from '../middleware/validators/messageValidator';

const router = express.Router();

router.post(
  '/conversation/:conversation/message',
  checkAuthentication,
  validatePostMessage,
  asyncHandler(postMessage)
);
export default router;
