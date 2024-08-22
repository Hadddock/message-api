import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './__mocks__/mockApp';
import dbConnection from './__mocks__/mockDatabase';
import User from '../src/models/User';
import mongoose from 'mongoose';

import { maxContentLength, maxImageUrlLength } from '../src/interfaces/Message';
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
  messageOneId,
  conversationTwoId,
  conversationThreeId,
  conversationFullId,
  bulkUserArray,
} from '../test/utils/setupDatabase';

let cookiesUserOne: any;
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
  cookiesUserFour = await loginAndGetCookies('username4', 'P@ssw0rd');
});

describe('DELETE /conversation/:conversation/message/:message', () => {
  it('responds with a 403 due to not being logged in', (done) => {
    request(app)
      .delete(`/conversation/${conversationOneId}/message/${messageOneId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });

  it('responds with a 200 and deletes the message', (done) => {
    agent
      .delete(`/conversation/${conversationOneId}/message/${messageOneId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(205, done);
  });
  it('responds with a 400 due to not being the creator of the message', async () => {
    await agent
      .delete(`/conversation/${conversationOneId}/message/${messageOneId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserFour)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 400 due to message already being deleted', async () => {
    //delete the message
    await agent
      .delete(`/conversation/${conversationOneId}/message/${messageOneId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(205);
    //try deleting it again
    await agent
      .delete(`/conversation/${conversationOneId}/message/${messageOneId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400);
  });
});

describe('POST /conversation', () => {
  it('responds with a 201 and creates new message with only content', (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({
        content: 'Hello',
        imageUrl: 'https://en.wikipedia.org/static/images/icons/wikipedia.png',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 201 including both content and an image url', (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({
        content: "Here's the wikipedia logo!",
        imageUrl: 'https://en.wikipedia.org/static/images/icons/wikipedia.png',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 201 including an image url', (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({
        imageUrl: 'https://en.wikipedia.org/static/images/icons/wikipedia.png',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 400 due to not containing content or imageURL', (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({})
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to content only containing whitespace', (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({ content: '            ' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to content being empty', (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({ content: '' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to conversation not existing', (done) => {
    agent
      .post(`/conversation/${new mongoose.Types.ObjectId()}/message`)
      .send({ content: 'hello' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to content being > ${maxContentLength} characters long`, (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({
        content: 'a'.repeat(maxContentLength + 1),
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to imageurl being > ${maxImageUrlLength} characters long`, (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({
        imageUrl:
          'http://www.example.com/' +
          'a'.repeat(maxImageUrlLength + 1) +
          '.png',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 403 due to not being authenticated', (done) => {
    request(app)
      .post(`/conversation/${conversationOneId}/message`)
      .send({ content: 'hello' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });

  it('responds with a 400 due image url not being an image', (done) => {
    agent
      .post(`/conversation/${conversationOneId}/message`)
      .send({
        imageUrl:
          'https://en.wikipedia.org/wiki/File:Ented,_Nokturn_a-moll_-_Jesienny.ogg',
      })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });
});
