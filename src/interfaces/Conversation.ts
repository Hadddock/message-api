import { Message } from './Message';
import { User } from './User';
export interface Conversation {
  id: string;
  name: string;
  users: Array<User>;
  creationTime: Date;
  getPreview(): Promise<Preview>;
}

export interface Preview {
  id: string;
  name: string;
  users: Array<User>;
  creationTime: Date;
  latestMessage: Message;
}
const maxUsers = 12;
const minUsers = 2;
const minNameLength = 2;
const maxNameLength = 100;

export { maxUsers, minUsers, minNameLength, maxNameLength };
