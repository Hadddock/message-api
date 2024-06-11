import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create({
    instance: { port: 2000 },
  });
  const mongoUri = mongoServer.getUri();
  process.env.CONNECTION_STRING = mongoUri;
  await dbConnection(mongoUri);
});

describe('GET /home', () => {
  it('responds with a json message about authentication status', (done) => {
    request(app)
      .get('/home')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(401, { message: 'You are not authenticated' }, done);
  });
});
