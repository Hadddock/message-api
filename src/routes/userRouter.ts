import express from 'express';
import { createUser, getUser } from '../controllers/userController';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.post('/user', asyncHandler(createUser));

router.get('/user', asyncHandler(getUser));

export default router;
