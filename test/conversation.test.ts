import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';
import User from '../src/models/User';
import mongoose from 'mongoose';

const agent = request.agent(app);
let userOneId: mongoose.Types.ObjectId;
let userTwoId: mongoose.Types.ObjectId;

import {
  maxUsers,
  minUsers,
  minNameLength,
  maxNameLength,
} from '../src/interfaces/Conversation';

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
    .post('/login')
    .send({ username: 'username', password: 'P@ssw0rd' })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);

  const userOne = await User.findOne({ username: 'username' });
  const userTwo = await User.findOne({ username: 'username2' });
  if (userOne === null || userTwo === null) throw new Error('Users not found');

  userOneId = userOne._id;
  userTwoId = userTwo._id;
});

describe('POST /conversation', () => {
  it('responds with a 201 and creates new conversation', (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  describe('GET /conversations/previews', () => {
    it.only('responds with a 200 and returns conversation previews', async () => {
      const conversation = await agent
        .post('/conversation')
        .send({
          name: 'new conversation',
          users: [userOneId, userTwoId],
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);
      conversation;

      const conversationPreviews = await agent
        .get('/conversations/previews')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(conversationPreviews).toBeDefined();
      expect(conversationPreviews.body).toBeDefined();
      expect(conversationPreviews.body).toBeInstanceOf(Array);
      expect(conversationPreviews.body.length).toBe(1);
      console.log(conversationPreviews.body[0]);
    });
  });

  it(`responds with a 400 due to having > ${maxUsers} users`, async () => {
    let users = [];

    for (let i = 0; i < maxUsers; i++) {
      let currentUsername = 'repeatusername' + (i + 1);
      await agent
        .post('/signup')
        .send({
          username: currentUsername,
          password: 'P@ssw0rd',
          confirmPassword: 'P@ssw0rd',
        })
        .expect(201);
      let currentUser = await User.findOne({ username: currentUsername });
      if (currentUser) {
        users.push(currentUser._id);
      }
    }
    users.push(userOneId);

    await agent
      .post('/conversation')
      .send({
        name: 'toomanyusersconversation',
        users: users,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 400 due to having only one userId', (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to having only one distinct userId', (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userOneId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to having duplicate userIds', (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userTwoId, userOneId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to having no userIds', (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to having a name that is < ${minNameLength} characters long`, (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'a',
        users: [userOneId, userOneId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to having a name that is > ${maxNameLength} characters long`, (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'a'.repeat(maxNameLength + 1),
        users: [userOneId, userOneId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to having a userId that does not correspond to an actual user', (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [new mongoose.Types.ObjectId(), userOneId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to having a name that is not a string', (done) => {
    agent
      .post('/conversation')
      .send({
        name: 21,
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 403 due to not being authenticated', async () => {
    return request(app)
      .post('/conversation')
      .send({
        name: 'conversation',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });
});
