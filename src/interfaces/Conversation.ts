import { Message } from "./Message";
import { User } from "./User";
export interface Conversation {
  id: string;
  name: string;
  users: Array<User>;
  latestMessage: Message;
  creationTime: Date;
}
