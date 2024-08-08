import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';
import User from '../src/models/User';
import mongoose from 'mongoose';

const agent = request.agent(app);
let userOneId: mongoose.Types.ObjectId;
let userTwoId: mongoose.Types.ObjectId;
let userThreeId: mongoose.Types.ObjectId;

let bulkUserArray: string[] = [];

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
    .post('/signup')
    .send({
      username: 'username3',
      password: 'P@ssw0rd',
      confirmPassword: 'P@ssw0rd',
    })
    .expect(201);
  for (let i = 0; i < maxUsers; i++) {
    await agent
      .post('/signup')
      .send({
        username: 'user' + i,
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
      })
      .expect(201);

    let currentUser = await User.findOne({ username: 'user' + i });
    if (currentUser) {
      bulkUserArray.push(currentUser.id);
    }
  }

  await agent
    .post('/login')
    .send({ username: 'username', password: 'P@ssw0rd' })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);

  const userOne = await User.findOne({ username: 'username' });
  const userTwo = await User.findOne({ username: 'username2' });
  const userThree = await User.findOne({ username: 'username3' });

  if (userOne === null || userTwo === null || userThree === null)
    throw new Error('Users not found');

  userOneId = userOne.id;
  userTwoId = userTwo.id;
  userThreeId = userThree.id;
});

describe('GET /conversations/previews', () => {
  describe('when there are no conversations', () => {
    it('responds with a 200 and returns an empty array', async () => {
      const conversationPreviews = await agent
        .get('/conversations/previews')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(conversationPreviews).toBeDefined();

      expect(conversationPreviews.body).toBeDefined();
      expect(conversationPreviews.body).toBeInstanceOf(Array);
      expect(conversationPreviews.body.length).toBe(0);
    });
  });

  describe('when there are conversations', () => {
    let conversation: any;
    beforeAll(async () => {
      conversation = await agent
        .post('/conversation')
        .send({
          name: 'new conversation',
          users: [userOneId, userTwoId],
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201);

      await agent
        .post('/conversation/' + conversation.body._id + '/message')
        .send({ content: 'hello', conversation: conversation.body._id })
        .expect(201);
    });

    it('responds with a 403 due to not being authenticated', async () => {
      return request(app)
        .get('/conversations/previews')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('responds with a 200 and returns conversation previews', async () => {
      const conversationPreviews = await agent
        .get('/conversations/previews')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(conversationPreviews).toBeDefined();

      expect(conversationPreviews.body).toBeDefined();
      expect(conversationPreviews.body).toBeInstanceOf(Array);

      expect(conversationPreviews.body[0]).toBeDefined();
      expect(conversationPreviews.body[0]).toHaveProperty('name');
      expect(conversationPreviews.body[0]).toHaveProperty('latestMessage');
      expect(conversationPreviews.body[0]).toHaveProperty('creationTime');
      expect(conversationPreviews.body[0]).toHaveProperty('users');
      expect(conversationPreviews.body[0]).toHaveProperty('id');
      expect(conversationPreviews.body[0].name).toBe('new conversation');
      expect(conversationPreviews.body[0].users[0]).toEqual(userOneId);
      expect(conversationPreviews.body[0].latestMessage).toBeDefined();

      expect(conversationPreviews.body[0].latestMessage.content).toBe('hello');
    });
  });
});

describe('POST /conversation/:conversation/users', () => {
  let conversation: any;
  beforeAll(async () => {
    conversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
  });

  it('responds with a 403 due to not being authenticated', async () => {
    return request(app)
      .post(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userThreeId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 400 due to trying to add more users than possible', async () => {
    const bulkConversation = await agent
      //create conversation with 2 users
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
    //add maxUsers
    await agent
      .post(`/conversation/${bulkConversation.body._id}/users`)
      .send(bulkUserArray)
      .expect(400);
  });

  it('responds with a 200 and adds users to the conversation', async () => {
    const updatedConversation = await agent
      .post(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userThreeId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(updatedConversation).toBeDefined();
    expect(updatedConversation.body).toBeDefined();
    expect(updatedConversation.body).toHaveProperty('users');
    expect(updatedConversation.body.users).toContain(userOneId);
    expect(updatedConversation.body.users).toContain(userTwoId);
    expect(updatedConversation.body.users).toContain(userThreeId);
  });

  it('responds with a 404 due to having a userId that does not correspond to an actual user', async () => {
    await agent
      .post(`/conversation/${conversation.body._id}/users`)
      .send({ users: [new mongoose.Types.ObjectId()] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 404 due to having no users to add that are not already in the conversation', async () => {
    await agent
      .post(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userTwoId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 400 due to attempting to add self to conversation', async () => {
    await agent
      .post(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userOneId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });
});

describe('POST /conversation', () => {
  it('responds with a 201 and creates new conversation', async () => {
    const conversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);

    expect(conversation).toBeDefined();
    expect(conversation.body).toBeDefined();
    expect(conversation.body).toHaveProperty('name');
    expect(conversation.body).toHaveProperty('admins');
    expect(conversation.body).toHaveProperty('users');
    expect(conversation.body).toHaveProperty('creationTime');
    expect(conversation.body.name).toBe('new conversation');
    expect(conversation.body.users).toContain(userOneId);
    expect(conversation.body.users).toContain(userTwoId);
    expect(conversation.body.admins).toBeInstanceOf(Array);
    expect(conversation.body.admins).toContain(userOneId);
  });

  it(`responds with a 400 due to having > ${maxUsers} users`, async () => {
    await agent
      .post('/conversation')
      .send({
        name: 'toomanyusersconversation',
        users: bulkUserArray,
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
