import express from 'express';
import {
  getUser,
  putPins,
  home,
  login,
  logout,
  signUp,
  searchUser,
  deleteUser,
} from '../controllers/userController';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.get('/users/:user', asyncHandler(getUser));
router.put('/users/:user/pins', asyncHandler(putPins));
router.get('/users', asyncHandler(searchUser));
router.post('/login', asyncHandler(login));
router.get('/logout', asyncHandler(logout));
router.post('/signup', asyncHandler(signUp));
router.get('/home', asyncHandler(home));
router.delete('/users/:user', asyncHandler(deleteUser));
export default router;
