import User from '../models/User';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { RequestHandler } from 'express';

type MessageRequestBody = {
  content: string;
  imageUrl: string;
};

import {
  maxContentLength,
  minContentLength,
  maxImageUrlLength,
  minImageUrlLength,
} from '../models/Message';

export const postMessage: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({
      message: 'Users must be logged in to post messages.',
    });
  }

  const { content, imageUrl }: MessageRequestBody = req.body;
  const conversation = req.params.conversation;
  const user = req.user.id;

  if (!imageUrl && !content) {
    return res.status(400).json({
      message: 'Invalid message. Messages must contain content or an image URL',
    });
  }

  if (
    content &&
    (content.length < minContentLength || content.length > maxContentLength)
  ) {
    return res.status(400).json({
      message: `Invalid message content. Content must be between ${minContentLength} and ${maxContentLength} characters long`,
    });
  }

  if (
    imageUrl &&
    (imageUrl.length < minImageUrlLength || imageUrl.length > maxImageUrlLength)
  ) {
    return res.status(400).json({
      message: `Invalid image URL. URL must be between ${minImageUrlLength} and ${maxImageUrlLength} characters long`,
    });
  }

  try {
    const [foundConversation, foundUser] = await Promise.all([
      Conversation.find({ _id: conversation }),
      User.find({ _id: user }),
    ]);

    if (!foundConversation) {
      return res.status(400).json({ message: 'Invalid conversation' });
    }

    if (!foundUser) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    const message = new Message({
      user,
      content,
      imageUrl,
      conversation,
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};
