import User from '../models/User';
import Conversation from '../models/Conversation';
import { RequestHandler } from 'express';

interface ConversationRequestBody {
  name: string;
  users: string[];
}

export const postConversation: RequestHandler = async (req, res, next) => {
  let { name, users } = req.body;

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
