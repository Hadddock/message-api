import { Schema, model } from 'mongoose';
import {
  User as IUser,
  maxBioLength,
  maxPasswordLength,
  minPasswordLength,
  maxUsernameLength,
  minUsernameLength,
} from '../interfaces/User';
import isEmail from 'validator/lib/isEmail';
import { isStrongPassword } from 'validator';

const validateEmail = function (email: string) {
  return isEmail(email);
};

// Schema
const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    min: minUsernameLength,
    max: maxUsernameLength,
  },
  password: {
    type: String,
    min: minPasswordLength,
    max: maxPasswordLength,
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
  bio: { type: String, required: true, default: 'Hello!', max: maxBioLength },
  joinTime: { type: Date, required: true, default: Date.now() },
  pinnedConversations: [{ type: Schema.Types.ObjectId, ref: 'Conversation' }],
});

userSchema.methods.getPublicProfile = function () {
  return {
    username: this.username,
    avatar: this.avatar,
    userProfile: this.userProfile,
    bio: this.bio,
    joinTime: this.joinTime,
  };
};

const User = model<IUser>('User', userSchema);
export default User;
