import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../__mocks__/mockApp';
import User from '../../src/models/User';
import Conversation from '../../src/models/Conversation';
import Message from '../../src/models/Message';
import dbConnection from '../__mocks__/mockDatabase';
import bcrypt from 'bcrypt';
import { maxUsers } from '../../src/interfaces/Conversation';
import { maxMessages } from '../../src/controllers/conversationController';

export let userOneId: mongoose.Types.ObjectId;
export let userTwoId: mongoose.Types.ObjectId;
export let userThreeId: mongoose.Types.ObjectId;
export let messageOneId: mongoose.Types.ObjectId;
export let userFourId: mongoose.Types.ObjectId; //user four has blocked user one
export let conversationOneId: mongoose.Types.ObjectId; //user one is admin, conversation with user one and user two
export let conversationTwoId: mongoose.Types.ObjectId; //user two is admin, convesation with user two and user three
export let conversationThreeId: mongoose.Types.ObjectId; //user two is admin, conversation with user one and user two

export let pinnedConversationId: mongoose.Types.ObjectId; //user one has pinned this conversation

export let conversationFullId: mongoose.Types.ObjectId; // converation with maxUsers (including user one)
export let bulkUserArray: string[] = [];

let mongoServer: MongoMemoryServer;

export let agent = request.agent(app);

export const connectDatabase = async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { port: 2000 },
  });
  const mongoUri = mongoServer.getUri();
  process.env.CONNECTION_STRING = mongoUri;
  await dbConnection(mongoUri);
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

export const initializeDatabaseEntries = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  const userOne = new User({
    username: 'username',
    password: await bcrypt.hash('P@ssw0rd', 10),
  });
  await userOne.save();

  const userTwo = new User({
    username: 'username2',
    password: await bcrypt.hash('P@ssw0rd', 10),
  });
  await userTwo.save();

  const userThree = new User({
    username: 'username3',
    password: await bcrypt.hash('P@ssw0rd', 10),
  });

  await userThree.save();

  const userFour = new User({
    username: 'username4',
    password: await bcrypt.hash('P@ssw0rd', 10),
    blockedUsers: [userOne.id],
  });

  await userFour.save();

  userOneId = userOne.id;
  userTwoId = userTwo.id;
  userThreeId = userThree.id;
  userFourId = userFour.id;

  const conversationOne = new Conversation({
    name: 'conversationOne',
    users: [userOneId, userTwoId],
    admins: [userOneId],
  });
  await conversationOne.save();
  conversationOneId = conversationOne.id;

  const conversationOneNewMessage = new Message({
    content: 'hello this is a new message',
    conversation: conversationOneId,
    user: userTwoId,
    creationTime: new Date(Date.now() - 5000),
  });
  await conversationOneNewMessage.save();

  const conversationOneNewMessageTwo = new Message({
    content: 'hello this is a slightly newer message',
    conversation: conversationOneId,
    creationTime: new Date(Date.now() + 5000),
    user: userTwoId,
  });
  await conversationOneNewMessageTwo.save();

  const conversationTwo = new Conversation({
    name: 'conversationOne',
    users: [userTwoId, userThreeId],
    admins: [userTwoId],
  });
  await conversationTwo.save();

  conversationTwoId = conversationTwo.id;

  const conversationTwoMessage = new Message({
    content: 'hello',
    conversation: conversationTwoId,
    user: userTwoId,
  });
  await conversationTwoMessage.save();

  const conversationThree = new Conversation({
    name: 'conversationOne',
    users: [userTwoId, userOneId],
    admins: [userTwoId],
  });
  await conversationThree.save();

  conversationThreeId = conversationThree.id;

  const pinnedConversation = new Conversation({
    name: 'pinnedConversation',
    users: [userOneId, userTwoId],
    admins: [userOneId],
  });
  await pinnedConversation.save();
  pinnedConversationId = pinnedConversation.id;

  userOne.pinnedConversations.push(pinnedConversation.id);
  userOne.save();

  const userPromises = [];
  for (let i = 0; i < maxUsers - 1; i++) {
    const user = new User({
      username: 'user' + i,
      password: await bcrypt.hash('P@ssw0rd', 10),
    });
    userPromises.push(user.save());
  }

  const bulkUsers = await Promise.all(userPromises);

  bulkUserArray = bulkUsers.map((user) => user.id);
  bulkUserArray.push(userOneId.toString());

  const messageOne = new Message({
    content: 'hello',
    conversation: conversationOneId,
    user: userOneId,
  });

  messageOne.save();
  messageOneId = messageOne.id;

  const messagePromises = [];
  for (let i = 0; i < maxMessages; i++) {
    const message = new Message({
      content: 'hello' + i,
      conversation: conversationOneId,
      user: userOneId,
    });
    messagePromises.push(message.save());
  }
  await Promise.all(messagePromises);

  const conversationFull = new Conversation({
    name: 'fullConversation',
    users: bulkUserArray,
    admins: [userOneId],
  });
  conversationFull.save();

  conversationFullId = conversationFull.id;
};

export const loginAndGetCookies = async (
  username: string,
  password: string
) => {
  const response = await request(app)
    .post('/login')
    .send({ username, password })
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200);

  return response.headers['set-cookie'];
};
