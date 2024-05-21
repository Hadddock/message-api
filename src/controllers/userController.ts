import User from '../models/User';
import { RequestHandler } from 'express';
import passport from 'passport';

import { User as IUser } from './../interfaces/User';

export const createUser: RequestHandler = async (req, res, next) => {
  const newUser = new User(req.body);
  await newUser.save();
  res.json({ message: 'created' });
};

export const getUser: RequestHandler = async (req, res, next) => {
  res.send('placeholder');
};

export const login: RequestHandler = passport.authenticate('local', {});

export const logout: RequestHandler = async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  });
};

export const home: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    res.json({ message: 'You are authenticated' });
  } else {
    res.json({ message: 'You are not authenticated' });
  }
};
