import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './__mocks__/mockApp';
import dbConnection from './__mocks__/mockDatabase';
import User from '../src/models/User';
import mongoose from 'mongoose';

const agent = request.agent(app);
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
    })
    .expect(201);

  await agent
    .post('/signup')
    .send({
      username: 'username2',
      password: 'P@ssw0rd',
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

describe('POST /conversation', () => {
  console.log(conversation);

  it('responds with a 201 and creates new message', (done) => {
    agent
      .post(`/conversation/${conversation}/message`)
      .send({
        content: 'Hello',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });
});
