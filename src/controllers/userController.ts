import User from '../models/User';
import Conversation from '../models/Conversation';
import { RequestHandler } from 'express';
import passport from 'passport';
import { isStrongPassword, isEmail } from 'validator';
import bcrypt from 'bcrypt';

import {
  maxBioLength,
  maxPasswordLength,
  minPasswordLength,
  minUsernameLength,
  maxUsernameLength,
} from '../interfaces/User';

export const getBlockedUsers: RequestHandler = async (req, res, next) => {
  const user = await User.findById(req.user?.id).populate('blockedUsers');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const blockedUsers = user?.blockedUsers.map((u) => u.getPublicProfile());

  res.status(200).json(blockedUsers);
};

export const putBlock: RequestHandler = async (req, res, next) => {
  const { blockedUserId } = req.body;
  const blockedUser = await User.findById(blockedUserId);
  if (!blockedUser) {
    return res.status(404).json({ message: 'Blocked user not found' });
  }

  const currentUser = await User.findById(req.user?.id);

  if (!currentUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (currentUser.blockedUsers.includes(blockedUserId)) {
    return res.status(400).json({ message: 'User already blocked' });
  }

  currentUser.blockedUsers.push(blockedUserId);
  currentUser.save();

  return res.status(200).json({
    message: 'User blocked successfully',
    blockedUsers: currentUser.blockedUsers,
  });
};

export const putUnblock: RequestHandler = async (req, res, next) => {
  const { unblockedUserId } = req.body;
  const unblockedUser = await User.findById(unblockedUserId);
  if (!unblockedUser) {
    return res.status(404).json({ message: 'Unblocked user not found' });
  }

  const currentUser = await User.findById(req.user?.id);

  if (!currentUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!currentUser.blockedUsers.includes(unblockedUserId)) {
    return res.status(400).json({ message: 'User not blocked' });
  }

  currentUser.blockedUsers = currentUser.blockedUsers.filter(
    (id) => id != unblockedUserId
  );

  currentUser.save();
  return res.status(200).json({
    message: 'User unblocked successfully',
    blockedUsers: currentUser.blockedUsers,
  });
};

export const getPins: RequestHandler = async (req, res, next) => {
  const userId = req.params.user;
  const user = await User.findById(userId).populate('pinnedConversations');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json(user.pinnedConversations);
};

export const putPins: RequestHandler = async (req, res, next) => {
  const userId = req.params.user;

  let { pinnedConversations } = req.body;

  const conversations = await Conversation.find({
    _id: { $in: pinnedConversations },
  }).populate('users');

  if (conversations.length !== pinnedConversations.length) {
    return res
      .status(404)
      .json({ message: 'One or more conversations not found' });
  }

  if (
    conversations.some(
      (c) => !c.users.map((u) => u.id.toString()).includes(userId)
    )
  ) {
    return res
      .status(403)
      .json({ message: 'User is not a part of one or more conversations' });
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  user.pinnedConversations = pinnedConversations;
  user.save();

  return res.status(200).json({
    message: 'Conversations pinned successfully',
    pinnedConversations: user.pinnedConversations,
  });
};

export const getUser: RequestHandler = async (req, res, next) => {
  const userId = req.params.user;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json(user.getPublicProfile());
};

export const putUsername: RequestHandler = async (req, res, next) => {
  const { username } = req.body;
  const user = await User.findById(req.user?.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const existingUser = await User.findOne({
    username: new RegExp('^' + username + '$', 'i'),
  });

  if (existingUser) {
    return res.status(400).json({
      message: 'Username already taken',
    });
  }

  if (username === user.username) {
    return res.status(400).json({
      message: 'Username is the same as the current username',
    });
  }

  user.username = username;

  await user.save();
  res.status(200).json(user.getPublicProfile());
};

export const signUp: RequestHandler = async (req, res, next) => {
  const { username, password, email, bio } = req.body;

  const existingUser = await User.findOne({
    username: new RegExp('^' + username + '$', 'i'),
  });

  if (existingUser) {
    return res.status(400).json({
      message: 'Username already taken',
    });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message:
        'Password is not strong enough. Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    });
  }

  if (bio) {
    if (bio.length > maxBioLength) {
      return res.status(400).json({
        message: `Bio is too long. Bio must be <= ${maxBioLength} characters long`,
      });
    }
  }

  if (password.length > maxPasswordLength) {
    return res.status(400).json({
      message: `Password is too long. Password must be <= ${maxPasswordLength} characters long`,
    });
  }

  if (username.length < minUsernameLength) {
    return res.status(400).json({
      message: `Username is too short. Username must be greater than ${maxUsernameLength} characters long`,
    });
  }

  if (username.length > maxUsernameLength) {
    return res.status(400).json({
      message: `Username is too long. Username must be less than ${maxUsernameLength}`,
    });
  }

  if (email) {
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }
  }

  bcrypt.hash(req.body.password, 10, async (err, hash) => {
    if (err) {
      return next(err);
    }

    req.body.password = hash;

    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json({ message: 'User created' });
  });
};

export const searchUser: RequestHandler = async (req, res, next) => {
  const username = req.query.username;

  let page = Number(req.query.page) || 1;
  let limit = Number(req.query.limit) || 10;

  if (isNaN(page) || isNaN(limit)) {
    page = 1;
    limit = 10;
  }

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  const users = await User.find({ username: new RegExp('^' + username, 'i') })
    .limit(limit)
    .skip((page - 1) * limit);

  const publicProfiles = users.map((user) => user.getPublicProfile());

  if (publicProfiles.length > 0) {
    res.status(200).json(publicProfiles);
  } else {
    res.status(200).json([]);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  passport.authenticate('local', async (err: any, user: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Incorrect username or password' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).json({ message: 'Successfully logged in', user });
    });
  })(req, res, next);
};

export const logout: RequestHandler = async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid');
    res.status(200).send('logged out');
  });
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  if (req.user?.id !== req.params.user) {
    return res.status(403).json({
      message: 'Users can only delete their own account.',
    });
  }

  const { id } = req.params;

  await User.deleteOne({ id: id });

  res.clearCookie('connect.sid');
  res.status(204);
  res.send();
};

export const home: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    res.json({ message: 'You are authenticated' });
  } else {
    res.status(401).json({ message: 'You are not authenticated' });
  }
};
