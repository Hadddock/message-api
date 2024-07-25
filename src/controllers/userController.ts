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

//toggle a conversation as pinned
export const putPins: RequestHandler = async (req, res, next) => {
  let { conversationId, pin } = req.body;
  if (!conversationId) {
    return res.status(400).json({ message: 'Conversation ID is required' });
  }

  pin = typeof pin === 'undefined' ? true : pin;

  const conversation = await Conversation.findById(conversationId).populate(
    'users'
  );
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!conversation.users.some((u) => u.id === user.id)) {
    return res
      .status(403)
      .json({ message: 'Users can only pin conversations they are a part of' });
  }

  if (pin) {
    user.pinnedConversations.push(conversationId);
  } else {
    user.pinnedConversations = user.pinnedConversations.filter(
      (id) => id != conversationId
    );
  }
  user.save();
  const foundUser = await User.findById(req.user?.id);
  if (foundUser) {
    console.log(foundUser.pinnedConversations);
  }

  return res.status(200).json({
    message: 'Conversation pinned successfully',
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

type MessageRequestBody = {
  username: string;
  password: string;
  email?: string;
  bio?: string;
};

export const signUp: RequestHandler = async (req, res, next) => {
  const { username, password, email, bio }: MessageRequestBody = req.body;

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

  let page = req.query.page || 1;
  let limit = req.query.limit || 10;

  if (typeof page !== 'number' || typeof limit !== 'number') {
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
    res.status(200).send('logged out');
  });
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  if (req.user?.id !== req.params.user) {
    return res.status(403).json({
      message: 'Users can only delete their own account.',
    });
  }

  try {
    const { id } = req.params;

    await User.deleteOne({ _id: id });
    logout(req, res, () =>
      res.status(200).json({ message: 'User deleted successfully' })
    );
  } catch (error) {
    next(error);
  }
};

export const home: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    res.json({ message: 'You are authenticated' });
  } else {
    res.status(401).json({ message: 'You are not authenticated' });
  }
};
