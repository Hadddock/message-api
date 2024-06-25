import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';
import User from '../src/models/User';
import { signUp } from '../src/controllers/userController';

const agent = request.agent(app);

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
    .post('/login')
    .send({ username: 'username', password: 'P@ssw0rd' })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);
});

describe('POST /signup with existing username', () => {
  it('responds with a 400 username already taken', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, { message: 'Username already taken' }, done);
  });
});

describe('POST /signup with weak passwords', () => {
  it('responds with a 400 password not strong enough due to lacking uppercase characters', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'p@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });
});

// describe('POST /login', () => {
//   it('responds with a successful login message', (done) => {
//     request(app)
//       .post('/login')
//       .send({ username: 'username', password: 'password' })
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200, done);
//   });
// });

describe('GET /home', () => {
  it('responds with a json message about successful authentication status', (done) => {
    agent
      .get('/home')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, { message: 'You are authenticated' }, done);
  });
});

// describe('GET /home', () => {
//   it('responds with a json message about unsuccessful authentication status', (done) => {
//     request(app)
//       .get('/home')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(401, { message: 'You are not authenticated' }, done);
//   });
// });
