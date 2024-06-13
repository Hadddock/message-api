import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';
import User from '../src/models/User';

const agent = request.agent(app);

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create({
    instance: { port: 2000 },
  });
  const mongoUri = mongoServer.getUri();
  process.env.CONNECTION_STRING = mongoUri;
  await dbConnection(mongoUri);
  const user = new User({
    username: 'username',
    password: 'password',
    email: 'abcdefgh@gmail.com',
  });
  await user.save();
  await agent
    .post('/login')
    .send({ username: 'username', password: 'password' })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);
});

describe('POST /login', () => {
  it('responds with a successful login message', (done) => {
    request(app)
      .post('/login')
      .send({ username: 'username', password: 'password' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
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

describe('GET /home', () => {
  it('responds with a json message about unsuccessful authentication status', (done) => {
    request(app)
      .get('/home')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(401, { message: 'You are not authenticated' }, done);
  });
});
