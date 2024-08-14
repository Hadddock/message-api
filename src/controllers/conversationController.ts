import User from "../models/User";
import Conversation from "../models/Conversation";
import { RequestHandler } from "express";

export const postConversation: RequestHandler = async (req, res, next) => {
  let { name, users } = req.body;

  const foundUsers = await User.find({ _id: { $in: users } });

  if (foundUsers.length !== users.length) {
    return res.status(400).json({ message: "Invalid user id(s)" });
  }

  const conversation = new Conversation({ name, users });

  try {
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const deleteUserFromConversation: RequestHandler = async (
  req,
  res,
  next
) => {
  const { conversationId } = req.params;
  const usersToRemove: string[] = req.body.users;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const conversationUsers = conversation.users.map((id) => id.toString());

  if (conversationUsers.every((id) => !usersToRemove.includes(id))) {
    return res.status(400).json({
      message: "No listed users are in the conversation",
    });
  }

  conversation.users = conversation.users.filter(
    (user) => !usersToRemove.includes(user.id.toString())
  );

  conversation.save();
  res.status(204).json(conversation);
};

export const getPreviews: RequestHandler = async (req, res, next) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const conversations = await Conversation.find({
    users: user._id,
  });

  const previews = await Promise.all(conversations.map((c) => c.getPreview()));

  res.status(200).json(previews);
};
