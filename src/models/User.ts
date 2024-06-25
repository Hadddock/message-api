import { Schema, model } from 'mongoose';
import { User as IUser } from '../interfaces/User';
import isEmail from 'validator/lib/isEmail';
import { isStrongPassword } from 'validator';

const validateEmail = function (email: string) {
  return isEmail(email);
};

// Schema
const userSchema = new Schema<IUser>({
  username: { type: String, required: true, min: 3, max: 36 },
  password: {
    type: String,
    min: 8,
    max: 256,
    validate: [
      isStrongPassword,
      'Password is not strong enough. Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    ],
  },
  email: {
    type: String,
    validate: [validateEmail, 'Invalid email'],
  },
  avatar: { type: String },
  userProfile: { type: Object },
  bio: { type: String, required: true, default: 'Hello!' },
  joinTime: { type: Date, required: true, default: Date.now() },
  pinnedConversations: [{ type: Schema.Types.ObjectId, ref: 'Conversation' }],
});

const User = model<IUser>('User', userSchema);
export default User;
