import { Strategy } from 'passport-local';
import User from '../models/User';
import { User as IUser } from './../interfaces/User';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';

//add properties to passport user interface
declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

const LocalStrategy = new Strategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return done(null, undefined, { message: 'Username not found' });
    }
    if (user.password === undefined) {
      return done(null, undefined, { message: 'Password undefined' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return done(null, undefined, { message: 'Incorrect password' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

passport.use(LocalStrategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('user found!');
    done(null, user);
  } catch (err) {
    console.log('there was an error!');
    done(err);
  }
});

export const checkAuthentication = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(403).json({
      message: 'User must be logged in to perform this action.',
    });
  }
};
