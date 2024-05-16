import User from '../models/User';
import { RequestHandler } from 'express';

export const createUser: RequestHandler = async (req, res, next) => {
  const newUser = new User(req.body);
  await newUser.save();
  res.json({ message: 'created' });
};

export const getUser: RequestHandler = async (req, res, next) => {
  res.send('placeholder');
};
