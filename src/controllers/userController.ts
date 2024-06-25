import User from '../models/User';
import { RequestHandler } from 'express';
import passport from 'passport';
import { isStrongPassword } from 'validator';

import { User as IUser } from './../interfaces/User';

export const getUser: RequestHandler = async (req, res, next) => {
  res.send('placeholder');
};

export const signUp: RequestHandler = async (req, res, next) => {
  const { username, password } = req.body;

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

  const newUser = new User(req.body);
  await newUser.save();
  res.status(201).json({ message: 'User created' });
};

export const login: RequestHandler = async (req, res, next) => {
  passport.authenticate('local', (err: any, user: any) => {
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
