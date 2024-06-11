import { connect, set, connection } from 'mongoose';

const dbConnection = async (connectionString: string) => {
  if (process.env.NODE_ENV === 'dev') {
    set('debug', true);
  }
  console.log(connectionString);

  await connect(connectionString);
};
export default dbConnection;
