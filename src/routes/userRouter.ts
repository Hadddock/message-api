import express from 'express';
import {
  getUser,
  home,
  login,
  logout,
  signUp,
  searchUser,
} from '../controllers/userController';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.get('/user', asyncHandler(getUser));
router.get('/users', asyncHandler(searchUser));
router.post('/login', asyncHandler(login));
router.get('/logout', asyncHandler(logout));
router.post('/signup', asyncHandler(signUp));
router.get('/home', asyncHandler(home));
export default router;
