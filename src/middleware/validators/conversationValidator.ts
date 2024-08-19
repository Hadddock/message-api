import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import {
  maxUsers,
  minUsers,
  minNameLength,
  maxNameLength,
} from '../../interfaces/Conversation';

import { maxMessages } from './../../controllers/conversationController';

export const validateDeleteConversation = [
  check('conversation').isMongoId().withMessage('Invalid conversation id'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetConversationMessages = [
  check('conversation').isMongoId().withMessage('Invalid conversation id'),
  check('limit')
    .isNumeric()
    .optional()
    .withMessage('Invalid limit')
    .custom((value: number) => value <= maxMessages)
    .withMessage(
      `limit is too large. Limit must be less than or equal to ${maxMessages}`
    )
    .custom((value: number) => value > 0)
    .withMessage('limit must be greater than 0'),
  check('page')
    .isNumeric()
    .optional()
    .withMessage('Invalid page')
    .custom((value: number) => value > 0)
    .withMessage('page must be greater than 0'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateAddUsers = [
  check('users')
    .isArray()
    .custom((value: Array<string>) => {
      const set = new Set(value);
      return set.size === value.length;
    })
    .withMessage('Users must be unique')
    .custom(
      (value: Array<string>) =>
        value.length >= 1 && value.length <= maxUsers - 1
    )
    .withMessage(
      `User additions must include be between ${1}and ${maxUsers - 1}`
    )
    .custom((value: Array<string>) =>
      value.every((id: string) => mongoose.Types.ObjectId.isValid(id))
    )
    .withMessage('user ids incorrectly formatted')
    .custom((value: Array<string>, { req }) => !value.includes(req.user.id))
    .withMessage('User cannot add themselves'),

  check('conversation')
    .isString()
    .isMongoId()
    .withMessage('Invalid conversation id'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateGetConversation = [
  check('conversation').isMongoId().withMessage('Invalid conversation id'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateDeleteLeaveConversation = [
  check('conversation').isMongoId().withMessage('Invalid conversation id'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePostConversation = [
  check('name')
    .isString()
    .notEmpty()
    .trim()
    .isLength({ max: maxNameLength, min: minNameLength })
    .withMessage(
      `name must be between ${minNameLength} and ${maxNameLength} characters`
    ),
  check('users')
    .isArray()
    .custom((value: Array<string>, { req }) => {
      return value.includes(req.user.id);
    })
    .withMessage(
      'User creating the conversation must be included in the conversation'
    )
    .custom((value: Array<string>) => {
      const set = new Set(value);
      return set.size === value.length;
    })
    .withMessage('Users must be unique')
    .custom((value) => value.length >= minUsers && value.length <= maxUsers)
    .withMessage(
      'Conversations must contain between ${minUsers} and ${maxUsers} users'
    )
    .custom((value: Array<string>) =>
      value.every((id: string) => mongoose.Types.ObjectId.isValid(id))
    )
    .withMessage('Invalid user id(s)'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateDeleteUsersFromConversation = [
  check('conversation').isMongoId().withMessage('Invalid conversation id'),
  check('users')
    .isArray()
    .withMessage('users must be an array')
    .custom((value: Array<string>, { req }) => {
      return !value.includes(req.user.id);
    })
    .withMessage('User cannot delete themselves from a conversation')
    .custom((value: Array<string>) => {
      const set = new Set(value);
      return set.size === value.length;
    })
    .withMessage('Users must be unique')
    .custom((value: Array<string>) =>
      value.every((id: string) => mongoose.Types.ObjectId.isValid(id))
    )
    .withMessage('Invalid user id(s)'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
