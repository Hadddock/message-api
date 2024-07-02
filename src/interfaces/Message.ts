import { Conversation } from './Conversation';
import { User } from './User';
export interface Message {
  id: string;
  content?: string;
  imageUrl?: string;
  postTime: Date;
  editTime?: Date;
  user: User;
  conversation: Conversation;
}

const maxContentLength = 1024;
const minContentLength = 1;

const minImageUrlLength = 10;
const maxImageUrlLength = 2048;
const imageRegex = /\.(jpe?g|png|gif|bmp|webp)$/i;

export {
  maxContentLength,
  minContentLength,
  maxImageUrlLength,
  minImageUrlLength,
  imageRegex,
};
