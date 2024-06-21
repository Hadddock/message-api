import { Conversation } from './Conversation';
import { User } from './User';
export interface Message {
  id: string;
  content?: string;
  imageUrl: string;
  editTime?: Date;
  user: User;
  conversation: Conversation;
}
