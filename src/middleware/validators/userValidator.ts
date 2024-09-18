import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import {
  minUsernameLength,
  maxUsernameLength,
  maxBioLength,
  minPasswordLength,
  maxPasswordLength,
} from '../../interfaces/User';
import mongoose from 'mongoose';

export const validateGetBlockedUsers = [
  check('user')
    .isMongoId()
    .withMessage('Invalid user id')
    .custom((value, { req }) => {
      return req.user?.id === value;
    })
    .withMessage('User can only get their own blocked users'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateBlock = [
  check('blockedUserId')
    .isMongoId()
    .withMessage('Invalid blocked user id')
    .custom((value, { req }) => {
      return req.user?.id !== value;
    })
    .withMessage('User cannot block themselves'),
  check('user')
    .isMongoId()
    .withMessage('Invalid user id')
    .custom((value, { req }) => {
      return req.user?.id === value;
    })
    .withMessage('User can only block other users for themselves'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUnblock = [
  check('unblockedUserId')
    .isMongoId()
    .withMessage('Invalid unblocked user id')
    .custom((value, { req }) => {
      return req.user?.id !== value;
    })
    .withMessage('User cannot block or unblock themselves'),
  check('user')
    .isMongoId()
    .withMessage('Invalid user id')
    .custom((value, { req }) => {
      return req.user?.id === value;
    })
    .withMessage('User can only unblock other users for themselves'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateSearchUser = [
  check('username')
    .isString()
    .withMessage('Invalid username')
    .trim()
    .notEmpty()
    .withMessage('Username cannot be empty')
    .isLength({ max: maxUsernameLength })
    .withMessage(`Username must be less than ${maxUsernameLength} characters`),
  check('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid page number. Page number must be greater than 0'),
  check('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage(`Invalid limit. Limit must be between 1 and 100`),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetPins = [
  check('user')
    .isMongoId()
    .withMessage('Invalid user id')
    .custom((value, { req }) => {
      return req.user?.id === value;
    })
    .withMessage('User can only get their own pinned conversations'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
export const validatePutPins = [
  check('pinnedConversations')
    .isArray()
    .custom((value: Array<string>) =>
      value.every((id: string) => mongoose.Types.ObjectId.isValid(id))
    )
    .withMessage('conversation ids incorrectly formatted'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetUser = [
  check('user').isMongoId().withMessage('Invalid user id'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateDeleteUser = [
  check('user')
    .isMongoId()
    .withMessage('Invalid user id')
    .custom((value, { req }) => {
      return req.user?.id === value;
    })
    .withMessage('User can only delete themselves'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePutUsername = [
  check('username')
    .isString()
    .withMessage('username must be a string')
    .isLength({ min: minUsernameLength, max: maxUsernameLength })
    .withMessage(
      `Invalid username. Username must be between ${minUsernameLength} and ${maxUsernameLength} characters`
    ),
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
    .withMessage('username must be a string')
    .isLength({ min: minUsernameLength, max: maxUsernameLength })
    .withMessage(
      `Invalid username. Username must be between ${minUsernameLength} and ${maxUsernameLength} characters`
    ),
  check('email').optional().isEmail().withMessage('Invalid email'),
  check('password')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      'Password is not strong enough. Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  check('bio')
    .optional()
    .isString()
    .withMessage('Bio must be a string')
    .isLength({ max: maxBioLength })
    .withMessage(`Bio must be less than ${maxBioLength} characters`),
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
