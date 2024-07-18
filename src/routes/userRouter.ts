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
import { checkAuthentication } from '../middleware/authentication';

const router = express.Router();

router.get('/users/:user', checkAuthentication, asyncHandler(getUser));
router.put('/users/:user/pins', checkAuthentication, asyncHandler(putPins));
router.get('/users', checkAuthentication, asyncHandler(searchUser));
router.post('/login', asyncHandler(login));
router.get('/logout', asyncHandler(logout));
router.post('/signup', asyncHandler(signUp));
router.get('/home', asyncHandler(home));
router.delete('/users/:user', checkAuthentication, asyncHandler(deleteUser));
export default router;
