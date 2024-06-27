import { Schema, model } from 'mongoose';
import { Message as IMessage } from '../interfaces/Message';
// Schema
const messageSchema = new Schema<IMessage>({
  content: { type: String, min: 1, max: 1024 },
  imageUrl: { type: String, min: 10, max: 2048 },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postTime: { type: Date, required: true, default: Date.now() },
  editTime: { type: Date, required: true },
});

const Message = model<IMessage>('Message', messageSchema);
export default Message;
