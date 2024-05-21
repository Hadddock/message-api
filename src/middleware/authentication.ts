import { Strategy } from 'passport-local';
import User from '../models/User';
import { User as IUser } from './../interfaces/User';
import passport from 'passport';

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
      return done(null, false, { message: 'Username not found' });
    }

    if (user.password !== password) {
      return done(null, false, { message: 'Incorrect password' });
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
