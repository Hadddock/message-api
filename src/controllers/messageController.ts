import User from '../models/User';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { RequestHandler } from 'express';

export const postMessage: RequestHandler = async (req, res, next) => {
  let { content, imageUrl } = req.body;

  content = content ? content.trim() : content;

  const conversation = req.params.conversation;
  const user = req.user?.id;

  try {
    const [foundConversation, foundUser] = await Promise.all([
      Conversation.findOne({ _id: conversation }),
      User.findOne({ _id: user }),
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
