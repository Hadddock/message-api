import User from '../models/User';
import Conversation from '../models/Conversation';
import { RequestHandler } from 'express';

export const postConversation: RequestHandler = async (req, res, next) => {
  let { name, users } = req.body;

  const foundUsers = await User.find({ _id: { $in: users } });

  if (foundUsers.length !== users.length) {
    return res.status(400).json({ message: 'Invalid user id(s)' });
  }

  const conversation = new Conversation({
    name,
    users,
    admins: [req.user?.id],
  });

  try {
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const getPreviews: RequestHandler = async (req, res, next) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const conversations = await Conversation.find({
    users: user._id,
  });

  const previews = await Promise.all(conversations.map((c) => c.getPreview()));

  res.status(200).json(previews);
};
