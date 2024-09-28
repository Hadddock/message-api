import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../test/__mocks__/mockApp';
import dbConnection from '../test/__mocks__/mockDatabase';
import User from '../src/models/User';
import mongoose from 'mongoose';

import {
  maxBioLength,
  maxPasswordLength,
  maxUsernameLength,
  minPasswordLength,
  minUsernameLength,
} from '../src/interfaces/User';

import { maxContentLength, maxImageUrlLength } from '../src/interfaces/Message';
import {
  connectDatabase,
  disconnectDatabase,
  initializeDatabaseEntries,
  loginAndGetCookies,
  userOnePassword,
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
  unpinnedConversationId,
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

describe('GET /users/:user/blocked-users', () => {
  //   beforeAll(async () => {
  //     await agent
  //       .put(`/users/${userOneId}/block`)
  //       .send({ blockedUserId: userTwoId });
  //   });

  //   afterAll(async () => {
  //     await agent
  //       .put(`/users/${userOneId}/unblock`)
  //       .send({ unblockedUserId: userTwoId });
  //   });

  it('responds with a 200 and blocked users', async () => {
    const response = await agent
      .get(`/users/${userFourId}/blocked-users`)
      .set('Cookie', cookiesUserFour)
      .expect(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].username).toBe('username');
  });

  it('responds with a 400 due to authenticated user not matching user param', async () => {
    await agent
      .get(`/users/${new mongoose.Types.ObjectId()}/blocked-users`)
      .set('Cookie', cookiesUserFour)
      .expect(400);
  });

  it('responds with a 403 due to user not being authenticated', (done) => {
    request(app).get(`/users/${userFourId}/blocked-users`).expect(403, done);
  });
});

describe('PUT /users/:user/block', () => {
  it('responds with a 200 and blocks a user', async () => {
    const response = await agent
      .put(`/users/${userOneId}/block`)
      .set('Cookie', cookiesUserOne)
      .send({ blockedUserId: userTwoId })
      .expect(200);

    expect(response.body.blockedUsers[0].toString()).toEqual(
      userTwoId.toString()
    );
  });

  it('responds with a 400 due to blockedUserId not being included', async () => {
    await agent
      .put(`/users/${userOneId}/block`)
      .set('Cookie', cookiesUserOne)
      .expect(400);
  });

  it('responds with a 400 due to current user id not matching path parameter', async () => {
    await agent
      .put(`/users/${userThreeId}/block`)
      .send({ blockedUserId: userTwoId })
      .set('Cookie', cookiesUserOne)
      .expect(400);
  });

  it('responds with a 400 due to current user trying to block themselves', async () => {
    await agent
      .put(`/users/${userOneId}/block`)
      .send({ blockedUserId: userOneId })
      .set('Cookie', cookiesUserOne)
      .expect(400);
  });

  it('responds with a 404 due to blockedUser not being found', async () => {
    await agent
      .put(`/users/${userOneId}/block`)
      .send({ blockedUserId: new mongoose.Types.ObjectId(), block: true })
      .set('Cookie', cookiesUserOne)
      .expect(404);
  });

  it('responds with a 403 due to user not being logged in', async () => {
    await request(app)
      .put(`/users/${userOneId}/block`)
      .send({ blockedUserId: userTwoId })
      .expect(403);
  });

  it('responds with a 400 due to userId not being a string', async () => {
    await agent
      .put(`/users/${userOneId}/block`)
      .set('Cookie', cookiesUserOne)
      .send({ blockedUserId: { userTwoId }, block: true })
      .expect(400);
  });
});

describe('PUT /users/:user/unblock', () => {
  it('responds with a 200 and unblocks a user', async () => {
    const response = await agent
      .put(`/users/${userFourId}/unblock`)
      .set('Cookie', cookiesUserFour)
      .send({ unblockedUserId: userOneId })
      .expect(200);

    expect(response.body.blockedUsers).toHaveLength(0);
  });

  it('responds with a 400 due to unblockedUserId not being included', async () => {
    await agent
      .put(`/users/${userFourId}/unblock`)
      .set('Cookie', cookiesUserFour)
      .expect(400);
  });

  it('responds with a 400 due to current user id not matching path parameter', async () => {
    await agent
      .put(`/users/${userThreeId}/unblock`)
      .send({ unblockedUserId: userTwoId })
      .set('Cookie', cookiesUserFour)
      .expect(400);
  });

  it('responds with a 400 due to current user trying to unblock themselves', async () => {
    await agent
      .put(`/users/${userFourId}/unblock`)
      .send({ unblockedUserId: userFourId })
      .set('Cookie', cookiesUserFour)
      .expect(400);
  });

  it('responds with a 404 due to unblockedUser not being found', async () => {
    await agent
      .put(`/users/${userFourId}/unblock`)
      .send({ unblockedUserId: new mongoose.Types.ObjectId() })
      .set('Cookie', cookiesUserFour)
      .expect(404);
  });

  it('responds with a 403 due to user not being authenticated', async () => {
    await request(app)
      .put(`/users/${userFourId}/unblock`)
      .send({ unblockedUserId: userOneId })
      .expect(403);
  });

  it('responds with a 400 due to unblockedUserId not being a string', async () => {
    await agent
      .put(`/users/${userFourId}/unblock`)
      .set('Cookie', cookiesUserFour)
      .send({ unblockedUserId: { userOneId } })
      .expect(400);
  });
});

describe('GET /users', () => {
  it('searches for a user successfully with an exact unique username', async () => {
    const users = await agent
      .get('/users')
      .query({ username: 'username3' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(users.body.length).toBe(1);
    expect(users.body[0].username).toBe('username3');
  });

  it('searches for a user case insensitively with an exact unique username', async () => {
    const users = await agent
      .get('/users')
      .query({ username: 'uSeRnAme3' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(users.body.length).toBe(1);
    expect(users.body[0].username).toBe('username3');
  });

  it('responds with a 200 and no users', async () => {
    const users = await agent
      .get('/users')
      .query({ username: 'nobodyHasThisUsername' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(users.body).toHaveLength(0);
  });

  it('searches for users with usernames starting with user, and limits to 10 users by default', async () => {
    const users = await agent
      .get('/users')
      .query({ username: 'user' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(users.body.length).toBe(10);
  });

  it('returns distinct responses using limit and page', async () => {
    const usersPageOne = await agent
      .get('/users')
      .query({ username: 'user', limit: 1 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    const usersPageTwo = await agent
      .get('/users')
      .query({ username: 'user', limit: 1, page: 2 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(usersPageOne.body.length).toBe(1);
    expect(usersPageTwo.body.length).toBe(1);

    expect(usersPageOne.body[0].username).not.toBe(
      usersPageTwo.body[0].username
    );
  });

  it('searches for users with usernames starting with user, and limits results to 1', async () => {
    const users = await agent
      .get('/users')
      .query({ username: 'user', limit: 1 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(users.body.length).toBe(1);
  });

  it('searches for users with usernames starting with user, and skips to second page', async () => {
    const users = await agent
      .get('/users')
      .query({ username: 'user', page: 2 })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(users.body.length).toBe(5);
    expect(users.body[0].username).toBe('user6');
  });

  it('returns 400 due to limit being < 1', async () => {
    await agent
      .get('/users')
      .query({ username: 'user', limit: 0 })
      .set('Cookie', cookiesUserOne)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('returns 400 due to username not being provided', async () => {
    await agent
      .get('/users')
      .query({ username: 'user', limit: 0 })
      .set('Cookie', cookiesUserOne)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('returns 400 due to page being < 1', async () => {
    await agent
      .get('/users')
      .query({ username: 'user', page: 0 })
      .set('Cookie', cookiesUserOne)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('returns 400 due to limit being > 100', async () => {
    await agent
      .get('/users')
      .query({ username: 'user', limit: 101 })
      .set('Cookie', cookiesUserOne)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 403 due to not being logged in', async () => {
    await agent
      .get('/users')
      .query({ username: 'user' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  it('responds with a 400 due to username not being a string', (done) => {
    agent
      .get('/users')
      .query({ username: { user: 'user' } })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to limit not being a number', (done) => {
    agent
      .get('/users')
      .query({ username: 'user', limit: 'ten' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to page not being a number', (done) => {
    agent
      .get('/users')
      .query({ username: 'user', page: 'one' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to empty username', (done) => {
    agent
      .get('/users')
      .query({ username: '' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to whitespace only username', (done) => {
    agent
      .get('/users')
      .query({ username: '  ' })
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400, done);
  });
});

describe('PUT /users/:user/pins', () => {
  it('responds with a 200 and pins all conversations', async () => {
    let response = await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .send({
        pinnedConversations: [conversationOneId, unpinnedConversationId],
      })
      .expect(200);
    expect(response.body.pinnedConversations).toContain(unpinnedConversationId);
  });

  it('responds with a 200 and unpins all conversations', async () => {
    let response = await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .send({ pinnedConversations: [] })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body.pinnedConversations).toHaveLength(0);
  });

  it('responds with a 400 due to pinnedConversations not being included', async () => {
    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 404 due to pinned conversation not being found', async () => {
    //create a new conversation
    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .send({ pinnedConversations: [new mongoose.Types.ObjectId()] })
      .expect(404);
  });

  it('responds with a 403 due to url param user not being the same as authenticated user', async () => {
    await agent
      .put(`/users/${new mongoose.Types.ObjectId()}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .send({ pinnedConversations: [conversationOneId] })
      .expect(403);
  });

  it('responds with a 403 due to user not being authenticated', async () => {
    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({ pinnedConversations: [conversationOneId] })
      .expect(403);
  });

  it('responds with a 400 due to conversationId not being an array', async () => {
    await agent
      .put(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .send({ pinnedConversations: conversationOneId })
      .expect(400);
  });

  it('responds with a 403 due to user not being a part of the conversation', async () => {
    await agent
      .put(`/users/${userFourId}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserFour)
      .expect('Content-Type', /json/)
      .send({ pinnedConversations: [conversationOneId] })
      .expect(403);
  });
});

describe('GET /users/:user', () => {
  it('responds with a 200 and user', async () => {
    const userInformation = await agent
      .get(`/users/${userTwoId}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect(200);
    expect(userInformation.body.username).toBe('username2');
  });

  it('responds with a 404 due to userId not corresponding to any user', async () => {
    await agent
      .get(`/users/${new mongoose.Types.ObjectId()}`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect(404);
  });

  it('responds with a 403 due to not being logged in', async () => {
    await agent
      .get(`/users/${userTwoId}`)
      .set('Accept', 'application/json')
      .expect(403);
  });
});

describe('POST /signup', () => {
  it('responds with a 201 and creates a new user', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'newuser',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
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
        confirmPassword: 'P@ssw0rd',
        email: 'testemail@gmail.com',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201, done);
  });

  it('responds with a 400 username already taken', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'username',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, { message: 'Username already taken' }, done);
  });

  it('responds with a 400 username already taken with different casing', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'USERNAME',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, { message: 'Username already taken' }, done);
  });

  it('responds with a 400 bio too long', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'username',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
        bio: 'a'.repeat(maxBioLength + 1),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking an uppercase character', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'p@ssw0rd',
        confirmPassword: 'p@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a lowercase character', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@SSW0RD',
        confirmPassword: 'P@SSW0RD',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a symbol', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'Passw0rd',
        confirmPassword: 'Passw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 password not strong enough due to lacking a number', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@ssword',
        confirmPassword: 'P@ssword',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to password being > ${maxPasswordLength} characters long`, (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@ssw0r' + 'd'.repeat(maxPasswordLength - 6),
        confirmPassword: 'P@ssw0r' + 'd'.repeat(maxPasswordLength - 6),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to password being < ${minPasswordLength} characters long`, (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@0' + 'd'.repeat(minPasswordLength - 4),
        confirmPassword: 'P@0' + 'd'.repeat(minPasswordLength - 4),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to username being < ${minUsernameLength} characters long`, (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'us',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it(`responds with a 400 due to username being > ${maxUsernameLength} characters long`, (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'u'.repeat(maxUsernameLength + 1),
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rd',
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
        confirmPassword: 'P@ssw0rd',
        email: 'notanemail',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });

  it('responds with a 400 due to password and confirmPassword not matching', (done) => {
    request(app)
      .post('/signup')
      .send({
        username: 'usernametwo',
        password: 'P@ssw0rd',
        confirmPassword: 'P@ssw0rb',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400, done);
  });
});

describe('GET /logout', () => {
  it('logs out user successfully', async () => {
    await agent
      .get('/logout')
      .set('Cookie', cookiesUserOne)
      .expect(200, 'logged out');
  });
});

describe('GET /users/:user/pins', () => {
  it("responds with a 200 and retrives the user's pinned conversations", async () => {
    const response = await agent
      .get(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]._id).toBe(conversationOneId.toString());
  });

  it("responds with a 400 due to user attempting to retrive another user's pinnedConversations", async () => {
    const response = await agent
      .get(`/users/${userTwoId}/pins`)
      .set('Accept', 'application/json')
      .set('Cookie', cookiesUserOne)
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 403 due to user not being logged in', async () => {
    request(app)
      .get(`/users/${userOneId}/pins`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
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

describe('DELETE /users/:user', () => {
  it('responds with a 200 and deletes the user', async () => {
    await agent
      .delete(`/users/${userOneId}`)
      .set('Cookie', cookiesUserOne)
      .expect(204);
    //Ensure user was deleted out and is no longer authenticated
    await agent
      .post('/login')
      .send({
        username: 'username',
        password: 'P@ssw0rd',
      })
      .expect(401);
  });

  it('responds with a 400 due to attempting to delete the profile of another user', async () => {
    await agent
      .delete(`/users/${userTwoId}`)
      .set('Cookie', cookiesUserOne)
      .expect(400);
  });
});

describe('PUT /users/:user/username', () => {
  it('responds with a 200 and updates the username', async () => {
    const response = await agent
      .put(`/users/${userOneId}/username`)
      .set('Cookie', cookiesUserOne)
      .send({ username: 'newusername' })
      .expect(200);

    expect(response.body.username).toBe('newusername');
  });

  it('responds with a 400 due to username being taken', async () => {
    await agent
      .put(`/users/${userOneId}/username`)
      .set('Cookie', cookiesUserOne)
      .send({ username: 'username2' })
      .expect(400);
  });

  it('responds with a 400 due to username being the same', async () => {
    await agent
      .put(`/users/${userOneId}/username`)
      .set('Cookie', cookiesUserOne)
      .send({ username: 'username' })
      .expect(400);
  });

  it('responds with a 400 due to username being taken with different casing', async () => {
    await agent
      .put(`/users/${userOneId}/username`)
      .set('Cookie', cookiesUserOne)
      .send({ username: 'USERNAME2' })
      .expect(400);
  });

  it(`responds with a 400 due to username being < ${minUsernameLength} characters long`, async () => {
    await agent
      .put(`/users/${userOneId}/username`)
      .set('Cookie', cookiesUserOne)
      .send({ username: 'u'.repeat(minUsernameLength - 1) })
      .expect(400);
  });

  it(`responds with a 400 due to username being > ${maxUsernameLength} characters long`, async () => {
    await agent
      .put(`/users/${userOneId}/username`)
      .set('Cookie', cookiesUserOne)
      .send({
        username: 'u'.repeat(maxUsernameLength + 1),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });
});

describe('PUT /users/:user/password', () => {
  it('responds with a 200 and updates the password', async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'P@ssw0rd2',
        confirmPassword: 'P@ssw0rd2',
      })
      .expect(200);

    await agent
      .post('/login')
      .send({
        username: 'username',
        password: 'P@ssw0rd2',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('responds with a 400 password not strong enough due to lacking an uppercase character', async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'p@ssw0rd2',
        confirmPassword: 'p@ssw0rd2',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 400 password not strong enough due to lacking a lowercase character', async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'P@SSW0RD',
        confirmPassword: 'P@SSW0RD',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 400 password not strong enough due to lacking a symbol', async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'Passw0rd',
        confirmPassword: 'Passw0rd',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it('responds with a 400 password not strong enough due to lacking a number', async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'P@ssword',
        confirmPassword: 'P@ssword',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 400 due to password being > ${maxPasswordLength} characters long`, async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'P@ssw0r' + 'e'.repeat(maxPasswordLength - 6),
        confirmPassword: 'P@ssw0r' + 'e'.repeat(maxPasswordLength - 6),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 400 due to password being < ${minPasswordLength} characters long`, async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'P@0' + 'd'.repeat(minPasswordLength - 4),
        confirmPassword: 'P@0' + 'd'.repeat(minPasswordLength - 4),
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 400 due to currentPassword being incorrect`, async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword + 'a',
        newPassword: 'P@ssw0rd2',
        confirmPassword: 'P@ssw0rd2',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 400 due to newPassword not matching confirmPassword`, async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .set('Cookie', cookiesUserOne)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'P@ssw0rd2',
        confirmPassword: 'P@ssw0rd3',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  it(`responds with a 403 due to not being authenticated`, async () => {
    await agent
      .put(`/users/${userOneId}/password`)
      .send({
        currentPassword: userOnePassword,
        newPassword: 'P@ssw0rd2',
        confirmPassword: 'P@ssw0rd2',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });
});
