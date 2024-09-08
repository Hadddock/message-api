import User from '../models/User';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { RequestHandler } from 'express';

export const deleteMessage: RequestHandler = async (req, res, next) => {
  const messageId = req.params.message;
  const user = req.user?.id;
  if (!user) {
    return res.status(400).json({ message: 'Invalid user' });
  }
  const message = await Message.findOne({ _id: messageId }).populate('user');

  if (!message) {
    return res.status(400).json({ message: 'Invalid message' });
  }

  if (message.deleted) {
    return res.status(400).json({ message: 'Message already deleted' });
  }

  if (message.user.id != user) {
    return res
      .status(400)
      .json({ message: 'Messages can only be deleted by their creator' });
  }

  message.deleted = true;
  message.deletedAt = new Date();

  await message.save();
  res.status(205).json({ message: 'Message deleted successfully' });
};

export const putMessage: RequestHandler = async (req, res, next) => {
  const messageId = req.params.message;
  const user = req.user?.id;
  let { content } = req.body;

  content = content ? content.trim() : content;

  const message = await Message.findOne({ _id: messageId })
    .populate('user')
    .populate('conversation')
    .populate('editTime');

  if (!message) {
    return res.status(400).json({ message: 'Invalid message' });
  }
  if (message.user.id != user) {
    return res
      .status(400)
      .json({ message: 'Messages can only be edited by their creator' });
  }

  const conversation = await Conversation.findOne({
    _id: message.conversation.id,
  }).populate('users');

  if (!conversation) {
    return res.status(400).json({ message: 'Invalid conversation' });
  }

  if (!conversation.users.map((user) => user.id.toString()).includes(user)) {
    return res.status(400).json({
      message: 'Messages can only be edited by users in the conversation',
    });
  }

  if (message.content === content) {
    return res.status(400).json({ message: 'Message content is unchanged' });
  }

  message.content = content;
  message.editTime = new Date();
  await message.save();
  return res.status(200).json(message);
};

export const postMessage: RequestHandler = async (req, res, next) => {
  let { content, imageUrl } = req.body;

  content = content ? content.trim() : content;

  const conversation = req.params.conversation;
  const user = req.user?.id;

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
    readBy: [user],
    conversation,
  });
  await message.save();
  res.status(201).json(message);
};
