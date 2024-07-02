import User from '../models/User';
import Conversation from '../models/Conversation';
import { RequestHandler } from 'express';

interface ConversationRequestBody {
  name: string;
  users: string[];
}
import {
  maxUsers,
  minUsers,
  minNameLength,
  maxNameLength,
} from '../interfaces/Conversation';

export const postConversation: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({
      message: 'Users must be logged in to post conversations.',
    });
  }

  let { name, users }: ConversationRequestBody = req.body;
  name = String(name);

  if (
    !Array.isArray(users) ||
    !users.every((user) => typeof user === 'string')
  ) {
    return res.status(400).json({
      message: 'Invalid users. Users must be an array of strings.',
    });
  }

  if (typeof name !== 'string') {
    return res.status(400).json({
      message: 'Invalid conversation name. Name must be a string.',
    });
  }

  if (name.length < minNameLength || name.length > maxNameLength) {
    return res.status(400).json({
      message: `Invalid conversation name. Name must be between ${minNameLength} and ${maxNameLength} characters long`,
    });
  }

  if (users.length < minUsers || users.length > maxUsers) {
    return res.status(400).json({
      message: `Invalid number of users. Conversations must contain between ${minUsers} and ${maxUsers} users`,
    });
  }
  const foundUsers = await User.find({ _id: { $in: users } });

  if (foundUsers.length !== users.length) {
    return res.status(400).json({ message: 'Invalid user id(s)' });
  }

  const conversation = new Conversation({ name, users });

  try {
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};
