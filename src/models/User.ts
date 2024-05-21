import { Schema, model } from 'mongoose';
import { User as IUser } from '../interfaces/User';
// Schema
const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  password: { type: String },
  email: { type: String },
  avatar: { type: String },
  userProfile: { type: Object },
  bio: { type: String, required: true, default: 'Hello!' },
  joinTime: { type: Date, required: true, default: Date.now() },
  pinnedConversations: { type: Array },
});

const User = model<IUser>('User', userSchema);
export default User;
