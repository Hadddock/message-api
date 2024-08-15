import User from '../models/User';
import Conversation from '../models/Conversation';
import { RequestHandler } from 'express';
import { maxUsers } from '../interfaces/Conversation';

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

  await conversation.save();
  res.status(201).json(conversation);
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

export const deleteUsersFromConversation: RequestHandler = async (
  req,
  res,
  next
) => {
  const conversationId = req.params.conversation;
  const usersToRemove: string[] = req.body.users;

  const conversation = await Conversation.findById(conversationId)
    .populate('admins')
    .populate('users');

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const adminIds = conversation.admins.map((a) => a.id);

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!adminIds.includes(req.user?.id)) {
    return res
      .status(403)
      .json({ message: 'Only admins can remove users from a conversation' });
  }

  const conversationUsers = conversation.users.map((user) =>
    user.id.toString()
  );

  if (conversationUsers.every((id) => !usersToRemove.includes(id))) {
    return res.status(404).json({
      message: 'No listed users are in the conversation',
    });
  }

  conversation.users = conversation.users.filter(
    (user) => !usersToRemove.includes(user.id.toString())
  );

  await conversation.save();
  console.log('conversation', conversation);
  return res.status(200).json(conversation);
};

export const postAddUsers: RequestHandler = async (req, res, next) => {
  let { users } = req.body;
  const { conversation } = req.params;

  const currentConversation = await Conversation.findById(conversation)
    .populate('admins')
    .populate('users');

  if (!currentConversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const adminIds = currentConversation.admins.map((a) => a.id);

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!adminIds.includes(req.user?.id)) {
    return res
      .status(403)
      .json({ message: 'Only admins can add a user to a conversation' });
  }

  const currentConversationUserIds = currentConversation.users.map((u) => u.id);

  users = users.filter((u: string) => !currentConversationUserIds.includes(u));

  const foundUsers = await User.find({ _id: { $in: users } });

  let foundUsersIds = foundUsers.map((u) => u.id);

  if (foundUsersIds.includes(req.user?.id)) {
    return res
      .status(400)
      .json({ message: 'You cannot add yourself to a conversation' });
  }

  if (foundUsers.length + currentConversation.users.length > maxUsers) {
    return res.status(400).json({ message: 'Too many users' });
  }

  if (foundUsers.length < 1) {
    return res.status(404).json({ message: 'No valid users to add' });
  }

  currentConversation.users = [...currentConversation.users, ...users];

  try {
    await currentConversation.save();
    res.status(200).json(currentConversation);
  } catch (error) {
    next(error);
  }
};
