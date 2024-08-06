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
  check('message').isString().isMongoId(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
export const validatePostMessage = [
  check('content')
    .isString()
    .optional({})
    .notEmpty()
    .custom((value) => {
      return value.trim() !== '';
    })
    .isLength({ min: minContentLength, max: maxContentLength }),
  check('imageUrl')
    .optional()
    .matches(imageRegex)
    .isString()
    .isURL()
    .isLength({ min: minImageUrlLength, max: maxImageUrlLength }),

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
