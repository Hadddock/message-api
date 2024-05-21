import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import * as middlewares from './middlewares';

import dbConnection from './middleware/database';
import userRouter from './routes/userRouter';

import session from 'express-session';
import passport from 'passport';

import { Strategy as LocalStrategy } from 'passport-local';
import './middleware/authentication';

import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: <string>process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
createDBConnection();

app.use(userRouter);
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;

async function createDBConnection() {
  dbConnection();
}
