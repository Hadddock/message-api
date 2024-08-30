import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';
import Message from '../src/models/Message';
import User from '../src/models/User';
import Conversation from '../src/models/Conversation';
import mongoose from 'mongoose';

import {
  connectDatabase,
  disconnectDatabase,
  initializeDatabaseEntries,
  loginAndGetCookies,
} from './utils/setupDatabase';

import { maxMessages } from '../src/controllers/conversationController';

import {
  maxUsers,
  minUsers,
  minNameLength,
  maxNameLength,
} from '../src/interfaces/Conversation';

import {
  userOneId,
  userTwoId,
  userThreeId,
  userFourId,
  conversationOneId,
  conversationTwoId,
  conversationThreeId,
  conversationFullId,
  bulkUserArray,
} from '../test/utils/setupDatabase';

let cookiesUserOne: any;
let cookiesUserTwo: any;
let cookiesUserFour: any;
let agent = request.agent(app);

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

beforeEach(async () => {
  await initializeDatabaseEntries();
  agent = request.agent(app); // Create a new agent instance
  cookiesUserOne = await loginAndGetCookies('username', 'P@ssw0rd');
  cookiesUserTwo = await loginAndGetCookies('username2', 'P@ssw0rd');
  cookiesUserFour = await loginAndGetCookies('username4', 'P@ssw0rd');
});

describe('GET /conversations/previews', () => {
  it('responds with a 403 due to not being authenticated', async () => {
    await agent
      .get('/conversations/previews')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 200 and returns conversation previews', async () => {
    const conversationPreviews = await agent
      .get('/conversations/previews')
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(conversationPreviews).toBeDefined();
    expect(conversationPreviews.body).toBeDefined();
    expect(conversationPreviews.body).toBeInstanceOf(Array);
    expect(conversationPreviews.body[0]).toBeDefined();
    expect(conversationPreviews.body[0]).toHaveProperty('name');
    expect(conversationPreviews.body[0]).toHaveProperty('newMessages');
    expect(conversationPreviews.body[0].newMessages).toBeDefined();
    expect(conversationPreviews.body[0].newMessages).toBeInstanceOf(Array);
    expect(conversationPreviews.body[0].newMessages.length).toBe(2);
    expect(conversationPreviews.body[0].newMessages[0].content).toBe(
      'hello this is a slightly newer message'
    );
    expect(conversationPreviews.body[0].newMessages[1].content).toBe(
      'hello this is a new message'
    );
    expect(conversationPreviews.body[0]).toHaveProperty('latestMessage');
    expect(conversationPreviews.body[0]).toHaveProperty('latestMessage');
    expect(conversationPreviews.body[0]).toHaveProperty('latestMessage');
    expect(conversationPreviews.body[0]).toHaveProperty('creationTime');
    expect(conversationPreviews.body[0]).toHaveProperty('users');
    expect(conversationPreviews.body[0]).toHaveProperty('id');
    expect(conversationPreviews.body[0].name).toBe('conversationOne');
    expect(conversationPreviews.body[0].users[0]).toEqual(userOneId);
    expect(conversationPreviews.body[0].latestMessage).toBeDefined();
  });

  it('responds with a 200 and returns an empty array for a user without conversations', async () => {
    //login as user without conversations

    const conversationPreviews = await agent
      .get('/conversations/previews')
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserFour)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(conversationPreviews).toBeDefined();
    expect(conversationPreviews.body).toBeDefined();
    expect(conversationPreviews.body).toBeInstanceOf(Array);
    expect(conversationPreviews.body.length).toBe(0);
  });
});

describe('DELETE /conversation/:conversation/leave', () => {
  it('responds with a 403 due to not being authenticated', async () => {
    await agent
      .delete(`/conversation/${conversationOneId}/leave`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .delete(`/conversation/${new mongoose.Types.ObjectId()}/leave`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 200 and successfully leaves the conversation', async () => {
    await agent
      .delete(`/conversation/${conversationOneId}/leave`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('responds with a 200 and successfully leaves the conversation and removes the conversation from pinned conversations', async () => {
    const userOne = await User.findById(userOneId).populate(
      'pinnedConversations'
    );
    expect(
      userOne?.pinnedConversations.map((conversation) => conversation.id)
    ).toContain(conversationOneId);

    await agent
      .delete(`/conversation/${conversationOneId}/leave`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(userOne?.pinnedConversations).not.toContain(conversationOneId);
  });

  //test for admin promotion on leaving
  //test for last user leaving deleting conversation
});

describe('GET /conversation/:conversation', () => {
  it('responds with a 403 due to not being authenticated', async () => {
    await request(app)
      .get(`/conversation/${conversationOneId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .get(`/conversation/${new mongoose.Types.ObjectId()}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 403 due to user not being a part of the conversation', async () => {
    await agent
      .get(`/conversation/${conversationTwoId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 200 and returns the conversation', async () => {
    const conversationResponse = await agent
      .get(`/conversation/${conversationOneId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(conversationResponse).toBeDefined();
    expect(conversationResponse.body).toBeDefined();
    expect(conversationResponse.body).toHaveProperty('name');
    expect(conversationResponse.body).toHaveProperty('admins');
    expect(conversationResponse.body).toHaveProperty('users');
    expect(conversationResponse.body).toHaveProperty('creationTime');
    expect(conversationResponse.body.name).toBe('conversationOne');

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
  it('responds with a 200 and returns the conversation messages', async () => {
    const conversationMessages = await agent
      .get(`/conversation/${conversationOneId}/messages`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
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
      .get(`/conversation/${conversationOneId}/messages`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
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
      .get(`/conversation/${conversationOneId}/messages`)
      .query({ limit: maxMessages })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
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
      .get(`/conversation/${conversationOneId}/messages`)
      .query({ page: 1 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    const converastionMessagesSecondPage = await agent
      .get(`/conversation/${conversationOneId}/messages`)
      .query({ page: 2 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
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
      .get(`/conversation/${conversationOneId}/messages`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .get(`/conversation/${new mongoose.Types.ObjectId()}/messages`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it(`responds with a 400 due to having a limit exceeding the maximum of ${maxMessages}`, async () => {
    await agent
      .get(`/conversation/${conversationOneId}/messages`)
      .query({ limit: maxMessages + 1 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 400 due to having a limit <= 0`, async () => {
    await agent
      .get(`/conversation/${conversationOneId}/messages`)
      .query({ limit: 0 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 400 due to having a page <= 0`, async () => {
    await agent
      .get(`/conversation/${conversationOneId}/messages`)
      .query({ page: 0 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 403 due to user not being a part of the conversation', async () => {
    await agent
      .get(`/conversation/${conversationTwoId}/messages`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(403);
  });
});

describe('DELETE /conversation/:conversation', () => {
  it('responds with a 403 due to not being authenticated', async () => {
    await request(app)
      .delete(`/conversation/${conversationOneId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .delete(`/conversation/${new mongoose.Types.ObjectId()}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 403 due to not being an admin of the conversation', async () => {
    await agent
      .delete(`/conversation/${conversationThreeId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 200 and successfully deletes the conversation', async () => {
    await agent
      .delete(`/conversation/${conversationOneId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    const conversationOne = await Conversation.findById(conversationOneId);
    expect(conversationOne).toBeNull();
    //test for conversation presence after deleting
  });

  it('responds with a 200 and successfully deletes the conversation and removes the pinned conversation from the user', async () => {
    const userOne = await User.findById(userOneId).populate(
      'pinnedConversations'
    );
    expect(
      userOne?.pinnedConversations.map((conversation) => conversation.id)
    ).toContain(conversationOneId);

    await agent
      .delete(`/conversation/${conversationOneId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(userOne?.pinnedConversations).not.toContain(conversationOneId);
    //test for conversation presence after deleting
  });
});

describe('DELETE /conversation/:conversation/users', () => {
  it('responds with a 200 and deletes the users from the conversation', async () => {
    await request(app)
      .delete(`/conversation/${conversationOneId}/users`)
      .send({ users: [userTwoId] })
      .set('Cookie', cookiesUserOne)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('responds with a 200 and deletes the users from the conversation and removes the conversation from the removed users pinned conversations', async () => {
    let userTwo = await User.findById(userTwoId).populate(
      'pinnedConversations'
    );
    expect(
      userTwo?.pinnedConversations.map((conversation) => conversation.id)
    ).toContain(conversationOneId);

    await agent
      .delete(`/conversation/${conversationOneId}/users`)
      .send({ users: [userTwoId] })
      .set('Cookie', cookiesUserOne)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    userTwo = await User.findById(userTwoId).populate('pinnedConversations');
    expect(
      userTwo?.pinnedConversations.map((conversation) => conversation.id)
    ).not.toContain(conversationOneId);
  });

  it('responds with a 403 due to not being authenticated', async () => {
    await agent
      .delete(`/conversation/${conversationOneId}/users`)
      .send({ users: [userThreeId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 400 due to user attempting to delete themselves from a conversation', async () => {
    await agent
      .delete(`/conversation/${conversationOneId}/users`)
      .send({ users: [userOneId] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 403 due to non admin attempting to delete users from a conversation', async () => {
    await agent
      .delete(`/conversation/${conversationThreeId}/users`)
      .send({ users: [userTwoId] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a userId that does not correspond to an actual user', async () => {
    await agent
      .delete(`/conversation/${conversationOneId}/users`)
      .send({ users: [new mongoose.Types.ObjectId()] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 404 due to having no users to remove that are in the conversation', async () => {
    await agent
      .delete(`/conversation/${conversationOneId}/users`)
      .send({ users: [userFourId] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

describe('POST /conversation/:conversation/users', () => {
  it('responds with a 403 due to not being authenticated', async () => {
    return request(app)
      .post(`/conversation/${conversationOneId}/users`)
      .send({ users: [userThreeId] })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 409 due to trying to add more users than possible', async () => {
    await agent
      .post(`/conversation/${conversationFullId}/users`)
      .send({ users: [userTwoId] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(409);
  });

  it('responds with a 403 due to attempting to add only users who have blocked the current user', async () => {
    await agent
      .post(`/conversation/${conversationOneId}/users`)
      .send({ users: [userFourId] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 200 and adds users to the conversation', async () => {
    const updatedConversation = await agent
      .post(`/conversation/${conversationOneId}/users`)
      .send({ users: [userThreeId] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
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
      .post(`/conversation/${conversationOneId}/users`)
      .send({ users: [new mongoose.Types.ObjectId()] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 400 due to having no users to add that are not already in the conversation', async () => {
    await agent
      .post(`/conversation/${conversationOneId}/users`)
      .send({ users: [userTwoId] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 400 due to attempting to add self to conversation', async () => {
    await agent
      .post(`/conversation/${conversationOneId}/users`)
      .send({ users: [userOneId] })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
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
        users: [...bulkUserArray, userTwoId],
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
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
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 403 due to not being authenticated', async () => {
    agent
      .post('/conversation')
      .send({
        name: 'conversation',
        users: [userOneId, userTwoId],
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 201 with only the current user due to attempting to create a conversation with  only users who have blocked the current user, creating a conversation solely with the current user', async () => {
    const currentConversation = await agent
      .post('/conversation')
      .send({
        name: 'new conversation',
        users: [userOneId, userFourId],
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
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
  });
});

describe.only('POST /conversation/:conversation/read', () => {
  it('responds with a 403 due to not being authenticated', async () => {
    await agent
      .post(`/conversation/${conversationOneId}/read`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 404 due to having a conversationId that does not correspond to an actual conversation', async () => {
    await agent
      .post(`/conversation/${new mongoose.Types.ObjectId()}/read`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('responds with a 200 and marks the conversation messages as read', async () => {
    await Message.find({ conversation: conversationOneId }).then((messages) => {
      expect(
        messages.every((message) =>
          message.readBy
            .map((user) => user.toString())
            .includes(userOneId.toString())
        )
      ).toBe(false);
    });

    await agent
      .post(`/conversation/${conversationOneId}/read`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);
    await Message.find({ conversation: conversationOneId }).then((messages) => {
      expect(
        messages.every((message) =>
          message.readBy
            .map((user) => user.toString())
            .includes(userOneId.toString())
        )
      ).toBe(true);
    });
  });

  it('responds with a 403 due to user not being a part of the conversation', async () => {
    await agent
      .post(`/conversation/${conversationTwoId}/read`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(403);
  });
});
