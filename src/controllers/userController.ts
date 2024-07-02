import User from '../models/User';
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

export const getUser: RequestHandler = async (req, res, next) => {
  res.send('placeholder');
};

type MessageRequestBody = {
  username: string;
  password: string;
  email?: string;
  bio?: string;
};

export const signUp: RequestHandler = async (req, res, next) => {
  const { username, password, email, bio }: MessageRequestBody = req.body;

  const existingUser = await User.findOne({ username: username });

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

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  const users = await User.find({ username: new RegExp('^' + username, 'i') });

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

export const home: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    res.json({ message: 'You are authenticated' });
  } else {
    res.status(401).json({ message: 'You are not authenticated' });
  }
};
