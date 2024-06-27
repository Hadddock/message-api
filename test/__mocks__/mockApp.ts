import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';

import userRouter from './../../src/routes/userRouter';
import conversationRouter from './../../src/routes/conversationRouter';
import messageRouter from './../../src/routes/messageRouter';

import session from 'express-session';
import passport from 'passport';
import './../../src/middleware/authentication';
import { errorHandler, notFound } from './../../src/middlewares';

import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = express();

app.use(morgan('dev'));
app.use(helmet());

app.use(express.json());
app.set('trust proxy', 1);
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      sameSite: 'none',
      secure: false, //secure must be false for retaining session with super agent
    },
  })
);
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use(userRouter);
app.use(conversationRouter);
app.use(messageRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
