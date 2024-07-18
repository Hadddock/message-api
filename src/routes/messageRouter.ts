import express from 'express';
import { postMessage } from '../controllers/messageController';
import asyncHandler from 'express-async-handler';
import { checkAuthentication } from '../middleware/authentication';

const router = express.Router();

router.post(
  '/conversation/:conversation/message',
  checkAuthentication,
  asyncHandler(postMessage)
);
export default router;
