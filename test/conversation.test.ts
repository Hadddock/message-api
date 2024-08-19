import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';
import User from '../src/models/User';
import mongoose from 'mongoose';
import { maxMessages } from '../src/controllers/conversationController';

const agent = request.agent(app);
let userOneId: mongoose.Types.ObjectId;
let userTwoId: mongoose.Types.ObjectId;
let userThreeId: mongoose.Types.ObjectId;
let userFourId: mongoose.Types.ObjectId;

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
  await agent
    .post('/signup')
    .send({
      username: 'username4',
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
  const userFour = await User.findOne({ username: 'username4' });

  if (
    userOne === null ||
    userTwo === null ||
    userThree === null ||
    userFour === null
  )
    throw new Error('Users not found');

  userOneId = userOne.id;
  userTwoId = userTwo.id;
  userThreeId = userThree.id;
  userFourId = userFour.id;
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

describe('DELETE /conversation/:conversation/leave', () => {
  let conversation: any;
  beforeAll(async () => {
    conversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation for leaving',
        users: [userOneId, userTwoId, userThreeId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
  });

  it('responds with a 403 due to not being authenticated', async () => {
    await request(app)
      .delete(`/conversation/${conversation.body._id}/leave`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .delete(`/conversation/${new mongoose.Types.ObjectId()}/leave`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 200 and successfully leaves the conversation', async () => {
    await agent
      .delete(`/conversation/${conversation.body._id}/leave`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  //test for admin promotion on leaving
  //test for last user leaving deleting conversation
});

describe('GET /conversation/:conversation', () => {
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
    await request(app)
      .get(`/conversation/${conversation.body._id}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .get(`/conversation/${new mongoose.Types.ObjectId()}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 403 due to user not being a part of the conversation', async () => {
    await agent
      .post('/login')
      .send({ username: 'username3', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .get(`/conversation/${conversation.body._id}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);

    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('responds with a 200 and returns the conversation', async () => {
    const conversationResponse = await agent
      .get(`/conversation/${conversation.body._id}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(conversationResponse).toBeDefined();
    expect(conversationResponse.body).toBeDefined();
    expect(conversationResponse.body).toHaveProperty('name');
    expect(conversationResponse.body).toHaveProperty('admins');
    expect(conversationResponse.body).toHaveProperty('users');
    expect(conversationResponse.body).toHaveProperty('creationTime');
    expect(conversationResponse.body.name).toBe('new conversation');

    const conversationUsers = conversationResponse.body.users.map(
      (user: any) => user._id
    );

    const conversationAdmins = conversationResponse.body.admins.map(
      (admin: any) => admin._id
    );
    expect(conversationResponse.body.users).toBeInstanceOf(Array);
    expect(conversationUsers).toContain(userOneId);
    expect(conversationUsers).toContain(userTwoId);
    expect(conversationResponse.body.admins).toBeInstanceOf(Array);
    expect(conversationAdmins).toContain(userOneId);
  });
});

describe('GET /conversation/:conversation/messages', () => {
  let conversation: any;
  beforeAll(async () => {
    conversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation for messages retrival',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);

    for (let i = 0; i < maxMessages; i++) {
      await agent
        .post('/conversation/' + conversation.body._id + '/message')
        .send({ content: 'hello' + i, conversation: conversation.body._id })
        .expect(201);
    }
  });

  it('responds with a 200 and returns the conversation messages', async () => {
    const conversationMessages = await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(conversationMessages).toBeDefined();
    expect(conversationMessages.body).toBeDefined();
    expect(conversationMessages.body).toHaveProperty('messages');
    expect(conversationMessages.body).toHaveProperty('pagination');
    expect(conversationMessages.body.pagination).toBeDefined();
    expect(conversationMessages.body.pagination).toHaveProperty('currentPage');
    expect(conversationMessages.body.pagination).toHaveProperty('totalPages');
    expect(conversationMessages.body.pagination).toHaveProperty('pageSize');
    expect(conversationMessages.body.pagination).toHaveProperty('totalItems');
    expect(conversationMessages.body.messages).toBeInstanceOf(Array);
  });

  it('responds with a 200 and returns the correct pagination values', async () => {
    const conversationMessages = await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(conversationMessages).toBeDefined();
    expect(conversationMessages.body).toBeDefined();
    expect(conversationMessages.body).toHaveProperty('messages');
    expect(conversationMessages.body).toHaveProperty('pagination');
    expect(conversationMessages.body.messages).toBeInstanceOf(Array);
    expect(conversationMessages.body.messages.length).toBe(10);
    expect(conversationMessages.body.pagination).toBeDefined();
    expect(conversationMessages.body.pagination).toHaveProperty('currentPage');
    expect(conversationMessages.body.pagination).toHaveProperty('totalPages');
    expect(conversationMessages.body.pagination).toHaveProperty('pageSize');
    expect(conversationMessages.body.pagination).toHaveProperty('totalItems');
    expect(conversationMessages.body.pagination.currentPage).toBe(1);
    expect(conversationMessages.body.pagination.totalPages).toBe(10);
    expect(conversationMessages.body.pagination.pageSize).toBe(10);
    expect(conversationMessages.body.pagination.totalItems).toBe(100);
  });

  it('responds with a 200 and returns the correct pagination results with the max page size', async () => {
    const conversationMessages = await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .query({ limit: maxMessages })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(conversationMessages).toBeDefined();
    expect(conversationMessages.body).toBeDefined();
    expect(conversationMessages.body).toHaveProperty('messages');
    expect(conversationMessages.body).toHaveProperty('pagination');
    expect(conversationMessages.body.messages).toBeInstanceOf(Array);
    expect(conversationMessages.body.messages.length).toBe(100);
    expect(conversationMessages.body.pagination).toBeDefined();
    expect(conversationMessages.body.pagination).toHaveProperty('currentPage');
    expect(conversationMessages.body.pagination).toHaveProperty('totalPages');
    expect(conversationMessages.body.pagination).toHaveProperty('pageSize');
    expect(conversationMessages.body.pagination).toHaveProperty('totalItems');
    expect(conversationMessages.body.pagination.currentPage).toBe(1);
    expect(conversationMessages.body.pagination.totalPages).toBe(1);
    expect(conversationMessages.body.pagination.pageSize).toBe(100);
    expect(conversationMessages.body.pagination.totalItems).toBe(100);
  });

  it('responds with a 200 and returns the correct results with different messages', async () => {
    const conversationMessages = await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .query({ page: 1 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    const converastionMessagesSecondPage = await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .query({ page: 2 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(conversationMessages).toBeDefined();
    expect(conversationMessages.body).toBeDefined();
    expect(conversationMessages.body).toHaveProperty('messages');
    expect(conversationMessages.body).toHaveProperty('pagination');
    expect(conversationMessages.body.messages).toBeInstanceOf(Array);
    expect(conversationMessages.body.messages.length).toBe(10);
    expect(conversationMessages.body.pagination).toBeDefined();
    expect(conversationMessages.body.pagination).toHaveProperty('currentPage');
    expect(conversationMessages.body.pagination).toHaveProperty('totalPages');
    expect(conversationMessages.body.pagination).toHaveProperty('pageSize');
    expect(conversationMessages.body.pagination).toHaveProperty('totalItems');
    expect(conversationMessages.body.pagination.currentPage).toBe(1);
    expect(conversationMessages.body.pagination.totalPages).toBe(10);
    expect(conversationMessages.body.pagination.pageSize).toBe(10);
    expect(conversationMessages.body.pagination.totalItems).toBe(100);

    expect(converastionMessagesSecondPage).toBeDefined();
    expect(converastionMessagesSecondPage.body).toBeDefined();
    expect(converastionMessagesSecondPage.body).toHaveProperty('messages');
    expect(converastionMessagesSecondPage.body).toHaveProperty('pagination');
    expect(converastionMessagesSecondPage.body.messages).toBeInstanceOf(Array);
    expect(converastionMessagesSecondPage.body.messages.length).toBe(10);
    expect(converastionMessagesSecondPage.body.pagination).toBeDefined();
    expect(converastionMessagesSecondPage.body.pagination).toHaveProperty(
      'currentPage'
    );
    expect(converastionMessagesSecondPage.body.pagination).toHaveProperty(
      'totalPages'
    );
    expect(converastionMessagesSecondPage.body.pagination).toHaveProperty(
      'pageSize'
    );
    expect(converastionMessagesSecondPage.body.pagination).toHaveProperty(
      'totalItems'
    );
    expect(converastionMessagesSecondPage.body.pagination.currentPage).toBe(2);
    expect(converastionMessagesSecondPage.body.pagination.totalPages).toBe(10);
    expect(converastionMessagesSecondPage.body.pagination.pageSize).toBe(10);
    expect(converastionMessagesSecondPage.body.pagination.totalItems).toBe(100);

    //add comparison of messages
  });

  it('responds with a 403 due to not being authenticated', async () => {
    await request(app)
      .get(`/conversation/${conversation.body._id}/messages`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .get(`/conversation/${new mongoose.Types.ObjectId()}/messages`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it(`responds with a 400 due to having a limit exceeding the maximum of ${maxMessages}`, async () => {
    await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .query({ limit: maxMessages + 1 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 400 due to having a limit <= 0`, async () => {
    await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .query({ limit: 0 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 400 due to having a page <= 0`, async () => {
    await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .query({ page: 0 })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 403 due to user not being a part of the conversation', async () => {
    await agent
      .post('/login')
      .send({ username: 'username3', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .get(`/conversation/${conversation.body._id}/messages`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);

    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});

describe('DELETE /conversation/:conversation', () => {
  let conversation: any;
  beforeAll(async () => {
    conversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation for deleting',
        users: [userOneId, userTwoId, userThreeId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
  });

  it('responds with a 403 due to not being authenticated', async () => {
    await request(app)
      .delete(`/conversation/${conversation.body._id}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .delete(`/conversation/${new mongoose.Types.ObjectId()}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 403 due to not being an admin of the conversation', async () => {
    await agent
      .post('/login')
      .send({ username: 'username3', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .delete(`/conversation/${conversation.body._id}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);

    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('responds with a 200 and successfully deletes the conversation', async () => {
    await agent
      .delete(`/conversation/${conversation.body._id}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    //test for conversation presence after deleting
  });
});

describe('DELETE /conversation/:conversation/users', () => {
  let conversation: any;
  beforeAll(async () => {
    conversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userTwoId, userThreeId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
  });

  it('responds with a 403 due to not being authenticated', async () => {
    await request(app)
      .delete(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userThreeId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 403 due to not being authenticated', async () => {
    await request(app)
      .delete(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userThreeId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 400 due to user attempting to delete themselves from a conversation', async () => {
    await agent
      .delete(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userOneId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('resonds with a 403 due to non admin attempting to delete users from a conversation', async () => {
    await agent
      .post('/login')
      .send({ username: 'username2', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .delete(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userOneId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);

    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('responds with a 404 due to having a userId that does not correspond to an actual user', async () => {
    await agent
      .delete(`/conversation/${conversation.body._id}/users`)
      .send({ users: [new mongoose.Types.ObjectId()] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 404 due to having no users to remove that are in the conversation', async () => {
    await agent
      .delete(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userFourId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);
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

  it('responds with a 403 due to attempting to add only users who have blocked the current user', async () => {
    await agent
      .post('/login')
      .send({ username: 'username3', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .put(`/users/${userThreeId}/block`)
      .set('Accept', 'application/json')
      .send({ blockedUserId: userOneId })
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .post(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userThreeId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);

    //reset block

    await agent
      .post('/login')
      .send({ username: 'username3', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .put(`/users/${userThreeId}/unblock`)
      .set('Accept', 'application/json')
      .send({ unblockedUserId: userOneId })
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
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

  it('responds with a 400 due to having no users to add that are not already in the conversation', async () => {
    await agent
      .post(`/conversation/${conversation.body._id}/users`)
      .send({ users: [userTwoId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
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

  it('responds with a 201 while only having one userId', (done) => {
    agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
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

  it('responds with a 201 with only the current user due to attempting to create a conversation with  only users who have blocked the current user', async () => {
    await agent
      .post('/login')
      .send({ username: 'username3', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .put(`/users/${userThreeId}/block`)
      .set('Accept', 'application/json')
      .send({ blockedUserId: userOneId })
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    const currentConversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userThreeId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
    expect(currentConversation).toBeDefined();
    expect(currentConversation.body).toBeDefined();
    expect(currentConversation.body).toHaveProperty('name');
    expect(currentConversation.body).toHaveProperty('admins');
    expect(currentConversation.body).toHaveProperty('users');
    expect(currentConversation.body).toHaveProperty('creationTime');
    expect(currentConversation.body.name).toBe('new conversation');
    expect(currentConversation.body.users).toContain(userOneId);
    expect(currentConversation.body.users.length).toBe(1);

    //reset block

    await agent
      .post('/login')
      .send({ username: 'username3', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .put(`/users/${userThreeId}/unblock`)
      .set('Accept', 'application/json')
      .send({ unblockedUserId: userOneId })
      .expect('Content-Type', /json/)
      .expect(200);

    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
