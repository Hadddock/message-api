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
});

describe('POST /signup', () => {
  it('responds with a 200 and creates new user', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'newuser',
        password: 'P@ssw0rd',
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
        email: 'testemail@gmail.com',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 400 username already taken', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'username', password: 'P@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, { message: 'Username already taken' }, done);
  });

  it('responds with a 400 password not strong enough due to lacking an uppercase character', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'p@ssw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a lowercase character', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'P@SSW0RD' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a symbol', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'Passw0rd' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a number', (done) => {
    request(app)
      .post('/signup')
      .send({ username: 'usernametwo', password: 'P@ssword' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to password being > 256 characters long', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password:
          'P@ssw0rdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to username being < 3 characters long', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'us',
        password: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to username being > 36 characters long', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
        password: 'P@ssw0rd',
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
        email: 'notanemail',
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
