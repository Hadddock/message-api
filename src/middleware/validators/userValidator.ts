import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { isStrongPassword } from 'validator';
import {
  minUsernameLength,
  maxUsernameLength,
  maxBioLength,
  minPasswordLength,
  maxPasswordLength,
} from '../../interfaces/User';

export const validateSearchUser = [
  check('username')
    .isString()
    .notEmpty()
    .trim()
    .isLength({ max: maxUsernameLength }),
  check('page').optional().isInt({ min: 1 }),
  check('limit').optional().isInt({ min: 1, max: 100 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetPins = [
  check('user').isMongoId(),
  check('user').custom((value, { req }) => {
    return req.user?.id === value;
  }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
export const validatePutPins = [
  check('conversationId').isString().isLength({ min: 24, max: 24 }),
  check('pin').optional().isBoolean(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetUser = [
  check('user').isString().isLength({ min: 24, max: 24 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateDeleteUser = [
  check('user').custom((value, { req }) => {
    return req.user?.id === value;
  }),
  check('user').isString().isLength({ min: 24, max: 24 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateSignUp = [
  check('username')
    .isString()
    .isLength({ min: minUsernameLength, max: maxUsernameLength }),
  check('email').optional().isEmail(),
  check('password').custom((value) => {
    if (!isStrongPassword(value)) {
      throw new Error(
        'Password is not strong enough. Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }
    return true;
  }),
  check('password')
    .isString()
    .isLength({ min: minPasswordLength, max: maxPasswordLength }),
  check('bio').optional().isString().isLength({ max: maxBioLength }),
  check('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
