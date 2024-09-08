import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { isStrongPassword } from 'validator';
import {
  maxContentLength,
  minContentLength,
  maxImageUrlLength,
  minImageUrlLength,
  imageRegex,
} from '../../interfaces/Message';

export const validateDeleteMessage = [
  check('message').isMongoId().withMessage('Invalid message id'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePutMessage = [
  check('content')
    .isString()
    .withMessage('content must be a string')
    .notEmpty()
    .withMessage('content cannot be empty')
    .custom((value) => {
      return value.trim() !== '';
    })
    .isLength({ min: minContentLength, max: maxContentLength })
    .withMessage(
      `Content must be between ${minContentLength} and ${maxContentLength} characters`
    ),

  check('conversation').isMongoId().withMessage('Invalid conversation id'),
  check('message').isMongoId().withMessage('Invalid message id'),

  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.content === undefined && req.body.imageUrl === undefined) {
      return res.status(400).json({
        errors: [
          'Invalid message. Messages must contain content or an image URL',
        ],
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validatePostMessage = [
  check('content')
    .optional()
    .isString()
    .withMessage('content must be a string')
    .notEmpty()
    .withMessage('content cannot be empty')
    .custom((value) => {
      return value.trim() !== '';
    })
    .isLength({ min: minContentLength, max: maxContentLength })
    .withMessage(
      `Content must be between ${minContentLength} and ${maxContentLength} characters`
    ),
  check('imageUrl')
    .optional()
    .matches(imageRegex)
    .isString()
    .withMessage('imageUrl must be a string')
    .isURL()
    .withMessage('Invalid imageUrl')
    .isLength({ min: minImageUrlLength, max: maxImageUrlLength })
    .withMessage(
      `imageUrl must be between ${minImageUrlLength} and ${maxImageUrlLength} characters`
    ),

  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.content === undefined && req.body.imageUrl === undefined) {
      return res.status(400).json({
        errors: [
          'Invalid message. Messages must contain content or an image URL',
        ],
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
