import { Conversation } from './Conversation';
export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  avatar?: string;
  userProfile?: Object;
  bio: string;
  joinTime: Date;
  pinnedConversations?: Array<Conversation>;
}

const maxBioLength = 140;
const minPasswordLength = 8;
const maxPasswordLength = 256;
const minUsernameLength = 3;
const maxUsernameLength = 36;

export {
  maxBioLength,
  minPasswordLength,
  maxPasswordLength,
  minUsernameLength,
  maxUsernameLength,
};
