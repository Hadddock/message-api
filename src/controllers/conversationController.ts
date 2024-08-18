import User from '../models/User';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import { RequestHandler } from 'express';
import { maxUsers } from '../interfaces/Conversation';

export const maxMessages = 100;

export const defaultLimit = 10;

export const getConversation: RequestHandler = async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.conversation)
    .populate('users')
    .populate('admins');

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const conversationUserIds = conversation.users.map((u) => u.id);
  const userId = req.user?.id ?? '';
  if (!conversationUserIds.includes(userId)) {
    return res.status(403).json({
      message: 'Only users in a conversation can access its information',
    });
  }
  return res.status(200).json(conversation);
};

export const getConversationMessages: RequestHandler = async (
  req,
  res,
  next
) => {
  const conversation = await Conversation.findById(req.params.conversation)
    .populate('users')
    .populate('admins');
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const conversationUserIds = conversation.users.map((u) => u.id);
  const userId = req.user?.id ?? '';

  if (!conversationUserIds.includes(userId)) {
    return res.status(403).json({
      message: 'Only users in a conversation can access its information',
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || defaultLimit;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ postTime: -1 })
    .skip(startIndex)
    .limit(limit);

  const totalMessages = await Message.countDocuments({
    conversation: conversation._id,
  });

  const totalPages = Math.ceil(totalMessages / limit);

  const pagination = {
    currentPage: page,
    totalPages: totalPages,
    pageSize: limit,
    totalItems: totalMessages,
  };

  return res.status(200).json({ messages, pagination });
};

export const deleteConversation: RequestHandler = async (req, res, next) => {
  let conversation = await Conversation.findById(
    req.params.conversation
  ).populate('admins');
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const adminIds = conversation.admins.map((a) => a.id);
  const userId = req.user?.id ?? '';
  if (!adminIds.includes(userId)) {
    return res
      .status(403)
      .json({ message: 'Only conversation admins can delete a conversation' });
  }

  await conversation.deleteOne({ _id: conversation._id });
  await Message.deleteMany({ conversation: conversation._id });

  return res.status(200).json({ message: 'Conversation deleted' });
};

export const postConversation: RequestHandler = async (req, res, next) => {
  let { name, users } = req.body;

  const foundUsers = await User.find({ _id: { $in: users } }).populate(
    'blockedUsers'
  );

  if (foundUsers.length !== users.length) {
    return res.status(400).json({ message: 'Invalid user id(s)' });
  }

  foundUsers.forEach((u) => {
    if (u.blockedUsers.some((b) => b.id === req.user?.id)) {
      users = users.filter((id: string) => id !== u.id);
    }
  });

  //only 1 including current user
  if (users.length === 1) {
    return res
      .status(403)
      .json({ message: 'No users to add that have not blocked you' });
  }

  const conversation = new Conversation({
    name,
    users,
    admins: [req.user?.id],
  });

  await conversation.save();
  return res.status(201).json(conversation);
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

  return res.status(200).json(previews);
};

export const deleteLeaveConversation: RequestHandler = async (
  req,
  res,
  next
) => {
  const conversation = await Conversation.findById(req.params.conversation)
    .populate('users')
    .populate('admins');

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const userId = req.user?.id;
  const conversationUserCount = conversation.users.length;
  conversation.users = conversation.users.filter((u) => u.id !== userId);
  conversation.admins = conversation.admins.filter((a) => a.id !== userId);

  if (conversationUserCount === conversation.users.length) {
    return res.status(404).json({ message: 'User not in conversation' });
  }

  if (conversation.users.length === 0) {
    await Conversation.deleteOne({ _id: conversation._id });
    await Message.deleteMany({ conversation: conversation._id });
    return res.status(200).json({ message: 'User left conversation' });
  }

  if (conversation.users.length > 1 && conversation.admins.length == 0) {
    conversation.admins = [conversation.users[0]];
  }

  await conversation.save();
  return res.status(200).json({ message: 'User left conversation' });
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

  conversation.admins = conversation.admins.filter(
    (user) => !usersToRemove.includes(user.id.toString())
  );

  await conversation.save();

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

  if (users.length === 0) {
    return res.status(400).json({ message: 'No new users to add' });
  }
  //filter out users who have blocked the user attempting to add them
  const requestedUserAdditions = await User.find({
    _id: { $in: users },
  }).populate('blockedUsers');

  if (requestedUserAdditions.length === 0) {
    return res.status(404).json({ message: 'Users not found' });
  }

  requestedUserAdditions.forEach((u) => {
    if (u.blockedUsers.some((b) => b.id === req.user?.id)) {
      users = users.filter((id: string) => id !== u.id);
    }
  });

  if (users.length === 0) {
    console.log("No users to add that haven't blocked you");
    return res
      .status(403)
      .json({ message: 'No users to add that have not blocked you' });
  }

  if (users.includes(req.user?.id)) {
    return res
      .status(400)
      .json({ message: 'You cannot add yourself to a conversation' });
  }

  if (users.length + currentConversation.users.length > maxUsers) {
    return res.status(400).json({ message: 'Too many users' });
  }

  if (users.length < 1) {
    return res.status(404).json({ message: 'No valid users to add' });
  }

  currentConversation.users = [...currentConversation.users, ...users];

  await currentConversation.save();
  return res.status(200).json(currentConversation);
};
