import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import * as middlewares from './middlewares';

import dbConnection from './middleware/database';
import userRouter from './routes/userRouter';
import conversationRouter from './routes/conversationRouter';

import session from 'express-session';
import passport from 'passport';

import { Strategy as LocalStrategy } from 'passport-local';
import './middleware/authentication';

import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.set('trust proxy', 1);
app.use(
  session({
    secret: <string>process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      sameSite: 'none',
      secure: true,
    },
  })
);
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
createDBConnection();

app.use(userRouter);
app.use(conversationRouter);
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;

async function createDBConnection() {
  dbConnection();
}
