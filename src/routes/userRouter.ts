import express from 'express';
import {
  getUser,
  home,
  login,
  logout,
  signUp,
} from '../controllers/userController';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.get('/user', asyncHandler(getUser));

router.post('/login', asyncHandler(login));
router.get('/logout', asyncHandler(logout));
router.post('/signup', asyncHandler(signUp));
router.get('/home', asyncHandler(home));
export default router;
