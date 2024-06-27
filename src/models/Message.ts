import { Schema, model } from 'mongoose';
import { Message as IMessage } from '../interfaces/Message';
// Schema

const maxContentLength = 1024;
const minContentLength = 1;

const minImageUrlLength = 10;
const maxImageUrlLength = 2048;

export {
  maxContentLength,
  minContentLength,
  maxImageUrlLength,
  minImageUrlLength,
};

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    min: minContentLength,
    max: maxContentLength,
  },
  imageUrl: {
    type: String,
    min: minImageUrlLength,
    max: maxImageUrlLength,
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postTime: { type: Date, required: true, default: Date.now() },
  editTime: { type: Date },
});

const Message = model<IMessage>('Message', messageSchema);
export default Message;
