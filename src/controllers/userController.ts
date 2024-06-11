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
