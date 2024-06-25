import User from '../models/User';
import Conversation from '../models/Conversation';
import { RequestHandler } from 'express';

export const postConversation: RequestHandler = async (req, res, next) => {
  const { name, users } = req.body;
  const conversation = new Conversation({ name, users });
  try {
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};
