import express from 'express';
import {
  putBlock,
  putUnblock,
  getUser,
  getPins,
  putPins,
  home,
  login,
  logout,
  signUp,
  searchUser,
  deleteUser,
  getBlockedUsers,
} from '../controllers/userController';
import asyncHandler from 'express-async-handler';
import {
  validatePutPins,
  validateGetPins,
  validateDeleteUser,
  validateGetUser,
  validateSearchUser,
  validateBlock,
  validateUnblock,
  validateSignUp,
  validateGetBlockedUsers,
} from '../middleware/validators/userValidator';
import { checkAuthentication } from '../middleware/authentication';

const router = express.Router();

router.put(
  '/users/:user/block',
  checkAuthentication,
  validateBlock,
  asyncHandler(putBlock)
);

router.get(
  '/users/:user/blocked-users',
  checkAuthentication,
  validateGetBlockedUsers,
  asyncHandler(getBlockedUsers)
);
router.put(
  '/users/:user/unblock',
  checkAuthentication,
  validateUnblock,
  asyncHandler(putUnblock)
);

router.get(
  '/users/:user',
  checkAuthentication,
  validateGetUser,
  asyncHandler(getUser)
);
router.get(
  '/users/:user/pins',
  checkAuthentication,
  validateGetPins,
  asyncHandler(getPins)
);
router.put(
  '/users/:user/pins',
  checkAuthentication,
  validatePutPins,
  asyncHandler(putPins)
);
router.get(
  '/users',
  checkAuthentication,
  validateSearchUser,
  asyncHandler(searchUser)
);
router.post('/login', asyncHandler(login));
router.get('/logout', asyncHandler(logout));
router.post('/signup', validateSignUp, asyncHandler(signUp));
router.get('/home', asyncHandler(home));
router.delete(
  '/users/:user',
  checkAuthentication,
  validateDeleteUser,
  asyncHandler(deleteUser)
);
export default router;
