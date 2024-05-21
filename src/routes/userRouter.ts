import express from 'express';
import {
  createUser,
  getUser,
  home,
  login,
  logout,
} from '../controllers/userController';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.post('/user', asyncHandler(createUser));

router.get('/user', asyncHandler(getUser));

router.post('/login', asyncHandler(login));
router.get('/logout', asyncHandler(logout));
router.get('/home', asyncHandler(home));
export default router;
