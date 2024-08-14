import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import {
  maxUsers,
  minUsers,
  minNameLength,
  maxNameLength,
} from '../../interfaces/Conversation';

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
        value.length >= 0 && value.length <= maxUsers - 1
    )
    .withMessage(`Users must be between ${0}and ${maxUsers - 1}`)
    .custom((value: Array<string>) =>
      value.every((id: string) => mongoose.Types.ObjectId.isValid(id))
    )
    .withMessage('user ids incorrectly formatted')
    .custom((value: Array<string>, { req }) => !value.includes(req.user.id))
    .withMessage('User cannot add themselves'),

  check('conversation').isString().isMongoId(),

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
    .isLength({ max: maxNameLength, min: minNameLength }),
  check('users')
    .isArray()
    .custom((value: Array<string>, { req }) => {
      return value.includes(req.user.id);
    })
    .custom((value: Array<string>) => {
      const set = new Set(value);
      return set.size === value.length;
    })
    .custom((value) => value.length >= minUsers && value.length <= maxUsers)
    .custom((value: Array<string>) =>
      value.every((id: string) => mongoose.Types.ObjectId.isValid(id))
    ),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateDeleteUserFromConversation = [
  check('conversation').isMongoId(),
  check('users')
    .isArray()
    .custom((value: Array<string>) => {
      const set = new Set(value);
      return set.size === value.length;
    })
    .custom((value: Array<string>) =>
      value.every((id: string) => mongoose.Types.ObjectId.isValid(id))
    ),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
