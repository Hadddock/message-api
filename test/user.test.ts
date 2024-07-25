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
let userThreeId: mongoose.Types.ObjectId;

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
      confirmPassword: 'P@ssw0rd',
      email: 'abcdefgh@gmail.com',
    })
    .expect(201);

  await agent
    .post('/signup')
    .send({
      username: 'username2',
      password: 'P@ssw0rd',
      confirmPassword: 'P@ssw0rd',
    })
    .expect(201);

  await agent
    .post('/signup')
    .send({
      username: 'username3',
      password: 'P@ssw0rd',
      confirmPassword: 'P@ssw0rd',
    })
    .expect(201);

  const userOne = await User.findOne({ username: 'username' });
  const userTwo = await User.findOne({ username: 'username2' });
  const userThree = await User.findOne({ username: 'username3' });
  if (userOne === null || userTwo === null || userThree === null)
    throw new Error('Users not found');

  userOneId = userOne._id;
  userTwoId = userTwo._id;
  userThreeId = userThree._id;

  await agent
    .post('/login')
    .send({ username: 'username', password: 'P@ssw0rd' })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);
});

describe('PUT /users/:user/pins', () => {
  let conversationId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    //create a new conversation
    const conversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
    conversationId = conversation.body._id;
  });

  beforeEach(async () => {
    await agent.get('/logout').expect(200, 'logged out');
    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  afterEach(async () => {
    await agent.get('/logout').expect(200, 'logged out');
    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('responds with a 200 and pins then unpins a conversation', async () => {
    let response = await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ conversationId: conversationId, pin: true })
      .expect(200);
    expect(response.body.pinnedConversations).toEqual([conversationId]);

    response = await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ conversationId: conversationId, pin: false })
      .expect(200);

    expect(response.body.pinnedConversations).toEqual([]);
  });

  it('responds with a 400 due to conversationId not being included', async () => {
    //create a new conversation
    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)

      .expect(400);
  });

  it('responds with a 404 due to conversation not being found', async () => {
    //create a new conversation
    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ conversationId: new mongoose.Types.ObjectId() })
      .expect(404);
  });

  it('responds with a 404 due to user not being found', async () => {
    await agent
      .put(`/users/${new mongoose.Types.ObjectId()}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ conversationId: new mongoose.Types.ObjectId() })
      .expect(404);
  });

  it('responds with a 403 due to user not being logged in', async () => {
    //create a new conversation
    await agent.get('/logout').expect(200, 'logged out');

    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ conversationId: conversationId })
      .expect(403);
  });

  it('responds with a 400 due to conversationId not being a string', async () => {
    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ conversationId: { conversationId } })
      .expect(400);
  });

  it('responds with a 400 due to pin not being a boolean', async () => {
    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ conversationId: conversationId, pin: { true: true } })
      .expect(400);
  });

  it('responds with a 403 due to user not being a part of the conversation', async () => {
    //create a new conversation
    const conversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
    const conversationId = conversation.body._id;

    //logout and login as user3
    await agent.get('/logout').expect(200, 'logged out');
    await agent
      .post('/login')
      .send({ username: 'username3', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    //attempt to pin conversation the user is not a part of
    await agent
      .put(`/users/${userThreeId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ conversationId: conversationId, pin: true })
      .expect(403);
  });
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
  it('responds with a 200 and 3 users', async () => {
    const response = await agent
      .get('/users?username=username')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)

      .expect(200);
    expect(response.body).toHaveLength(3);
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

  it('responds with a 403 due to not being logged in', (done) => {
    request(app).get('/users?username=username2').expect(403, done);
  });
});

describe('POST /signup', () => {
  it('responds with a 200 and creates new user', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'newuser',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
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
        confirmPassword: 'P@ssw0rd',
        email: 'testemail@gmail.com',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 400 username already taken', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'username',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, { message: 'Username already taken' }, done);
  });

  it('responds with a 400 username already taken with different casing', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'USERNAME',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
      })
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
        confirmPassword: 'P@ssw0rd',
        bio: 'a'.repeat(maxBioLength + 1),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking an uppercase character', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'p@ssw0rd',
        confirmPassword: 'p@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a lowercase character', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@SSW0RD',
        confirmPassword: 'P@SSW0RD',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a symbol', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'Passw0rd',
        confirmPassword: 'Passw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a number', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@ssword',
        confirmPassword: 'P@ssword',
      })
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
        confirmPassword: 'P@ssw0r' + 'd'.repeat(maxPasswordLength - 6),
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
        confirmPassword: 'P@ssw0rd',
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
        confirmPassword: 'P@ssw0rd',
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
        confirmPassword: 'P@ssw0rd',
        email: 'notanemail',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to password and confirmPassword not matching', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rb',
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

describe('DELETE /users/:user', () => {
  it('responds with a 400 due to attempting to delete the profile of another user', async () => {
    await agent.delete(`/users/${userTwoId}`).expect(400);
  });

  it('responds with a 200 and deletes and logs out user', async () => {
    await agent.delete(`/users/${userOneId}`).expect(200);
    //Ensure user was logged out and no longer authenticated
    await agent.delete(`/users/${userOneId}`).expect(403);
  });
});
