import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './__mocks__/mockApp';
import dbConnection from './__mocks__/mockDatabase';
import User from '../src/models/User';
import mongoose from 'mongoose';

const agent = request.agent(app);

import { maxContentLength, maxImageUrlLength } from '../src/interfaces/Message';
let userOneId: mongoose.Types.ObjectId;
let userTwoId: mongoose.Types.ObjectId;
let conversation: mongoose.Types.ObjectId;

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

  const createdConversation = await agent
    .post('/conversation')
    .send({ name: 'conversation', users: [userOneId, userTwoId] })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(201);
  conversation = createdConversation.body._id;
});

describe('DELETE /conversation/:conversation/message/:message', () => {
  let messageId: string;
  beforeEach(async () => {
    const response = await agent
      .post(`/conversation/${conversation}/message`)
      .send({ content: 'hello' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201);
    messageId = response.body._id;
  });

  it('responds with a 403 due to not being logged in', (done) => {
    request(app)
      .delete(`/conversation/${conversation}/message/${messageId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });

  it('responds with a 200 and deletes the message', (done) => {
    agent
      .delete(`/conversation/${conversation}/message/${messageId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(205, done);
  });
  it('responds with a 400 due to not being the creator of the message', async () => {
    await agent
      .post('/login')
      .send({ username: 'username2', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    await agent
      .delete(`/conversation/${conversation}/message/${messageId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
    await agent
      .post('/login')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('responds with a 400 due to message already being deleted', async () => {
    //delete the message
    await agent
      .delete(`/conversation/${conversation}/message/${messageId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(205);
    //try deleting it again
    await agent
      .delete(`/conversation/${conversation}/message/${messageId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });
});

describe('POST /conversation', () => {
  it('responds with a 201 and creates new message with only content', (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({
        content: 'Hello',
        imageUrl: 'https://en.wikipedia.org/static/images/icons/wikipedia.png',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 201 including both content and an image url', (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({
        content: "Here's the wikipedia logo!",
        imageUrl: 'https://en.wikipedia.org/static/images/icons/wikipedia.png',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 201 including an image url', (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({
        imageUrl: 'https://en.wikipedia.org/static/images/icons/wikipedia.png',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 400 due to not containing content or imageURL', (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to content only containing whitespace', (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({ content: '            ' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to content being empty', (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({ content: '' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to conversation not existing', (done) => {
    agent
      .post(`/conversation/${new mongoose.Types.ObjectId()}/message`)
      .send({ content: 'hello' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to content being > ${maxContentLength} characters long`, (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({
        content: 'a'.repeat(maxContentLength + 1),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to imageurl being > ${maxImageUrlLength} characters long`, (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({
        imageUrl:
          'http://www.example.com/' +
          'a'.repeat(maxImageUrlLength + 1) +
          '.png',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 403 due to not being logged in', (done) => {
    request(app)
      .post(`/conversation/${conversation}/message`)
      .send({ content: 'hello' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });

  it('responds with a 400 due image url not being an image', (done) => {
    request(app)
      .post(`/conversation/${conversation}/message`)
      .send({
        imageUrl:
          'https://en.wikipedia.org/wiki/File:Ented,_Nokturn_a-moll_-_Jesienny.ogg',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });
});
