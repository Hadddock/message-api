import { Conversation } from './Conversation';
import { User } from './User';
export interface Message {
  id: string;
  content?: string;
  imageUrl: string;
  postTime: Date;
  editTime?: Date;
  user: User;
  conversation: Conversation;
}
