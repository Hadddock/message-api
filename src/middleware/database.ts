import { connect, set, connection } from 'mongoose';

const dbConnection = async () => {
  if (process.env.NODE_ENV === 'dev') {
    set('debug', true);
  }

  await connect(<string>process.env.CONNECTION_STRING);
};
export default dbConnection;
