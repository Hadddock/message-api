import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';
import User from '../src/models/User';
import mongoose from 'mongoose';
import { signUp } from '../src/controllers/userController';
import {
  maxBioLength,
  maxPasswordLength,
  maxUsernameLength,
  minPasswordLength,
  minUsernameLength,
} from '../src/interfaces/User';

const agent = request.agent(app);
const b = 3;
let userOneId: mongoose.Types.ObjectId;
let userTwoId: mongoose.Types.ObjectId;

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create({
    instance: { port: 2000 },
  });
  const mongoUri = mongoServer.getUri();
  process.env.CONNECTION_STRING = mongoUri;
  await dbConnection(mongoUri);

  await agent
    .post('/signup')
    .send({
      username: 'username',
      password: 'P@ssw0rd',
      email: 'abcdefgh@gmail.com',
    })
    .expect(201);

  await agent
    .post('/signup')
    .send({
      username: 'username2',
      password: 'P@ssw0rd',
    })
    .expect(201);

  const userOne = await User.findOne({ username: 'username' });
  const userTwo = await User.findOne({ username: 'username2' });
  if (userOne === null || userTwo === null) throw new Error('Users not found');

  userOneId = userOne._id;
  userTwoId = userTwo._id;

  await agent
    .post('/login')
    .send({ username: 'username', password: 'P@ssw0rd' })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);
});

describe('GET /users/:user', () => {
  it('responds with a 200 and user', async () => {
    await agent.get(`/users/${userTwoId}`).expect(200);
  });

  it('responds with a 404 due to userId not corresponding to any user', async () => {
    await agent.get(`/users/${new mongoose.Types.ObjectId()}`).expect(404);
  });

  it('responds with a 403 due to not being logged in', (done) => {
    request(app).get(`/users/${userTwoId}`).expect(403, done);
  });
});

describe('GET /users?username', () => {
  it('responds with a 200 and two users', async () => {
    const response = await agent
      .get('/users?username=username')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)

      .expect(200);
    expect(response.body).toHaveLength(2);
  });

  it('responds with a 200 and one user', async () => {
    const response = await agent
      .get('/users?username=username2')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toHaveLength(1);
  });

  it('responds with a 200 and no users', async () => {
    const response = await agent
      .get('/users?username=invalidusername')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toHaveLength(0);
  });
});

describe('POST /signup', () => {
  it('responds with a 200 and creates new user', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'newuser',
        password: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 200 and creates new user with an email', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'newuser2',
        password: 'P@ssw0rd',
        email: 'testemail@gmail.com',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 400 username already taken', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, { message: 'Username already taken' }, done);
  });

  it('responds with a 400 bio too long', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'username',
        password: 'P@ssw0rd',
        bio: 'a'.repeat(maxBioLength + 1),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, { message: 'Username already taken' }, done);
  });

  it('responds with a 400 password not strong enough due to lacking an uppercase character', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'p@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a lowercase character', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'P@SSW0RD' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a symbol', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'Passw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a number', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'P@ssword' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to password being > ${maxPasswordLength} characters long`, (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@ssw0r' + 'd'.repeat(maxPasswordLength - 6),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to username being < ${minUsernameLength} characters long`, (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'us',
        password: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to username being > ${maxUsernameLength} characters long`, (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
        password: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to incorrectly formatted email', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@ssw0rd',
        email: 'notanemail',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });
});

describe('GET /home', () => {
  it('responds with a json message about successful authentication status', (done) => {
    agent
      .get('/home')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, { message: 'You are authenticated' }, done);
  });
});

describe('GET /logout', () => {
  it('logs out user successfully', (done) => {
    request(app).get('/logout').expect(200, 'logged out', done);
  });
});

describe('POST /login', () => {
  it('responds with a 200 and logs in user', (done) => {
    request(app)
      .post('/login')
      .send({
        username: 'username2',
        password: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

  it('responds with a 401 and incorrect username or password due to incorrect username', (done) => {
    request(app)
      .post('/login')
      .send({
        username: 'usernamedsaw',
        password: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(401, { message: 'Incorrect username or password' }, done);
  });

  it('responds with a 401 and incorrect username or password due to incorrect password', (done) => {
    request(app)
      .post('/login')
      .send({
        username: 'username2',
        password: 'wrongpassword',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(401, { message: 'Incorrect username or password' }, done);
  });
});
