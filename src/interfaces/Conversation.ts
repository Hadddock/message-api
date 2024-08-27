import { Message } from './Message';
import { User } from './User';

export interface Conversation {
  id: string;
  name: string;
  admins: Array<User>;
  users: Array<User>;
  creationTime: Date;
  getPreview(userId: string): Promise<Preview>;
}

export interface Preview {
  id: string;
  name: string;
  users: Array<User>;
  creationTime: Date;
  latestMessage: Message;
}
const maxUsers = 12;
const minUsers = 1;
const minNameLength = 2;
const maxNameLength = 100;

export { maxUsers, minUsers, minNameLength, maxNameLength };
