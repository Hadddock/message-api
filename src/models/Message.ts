import { Schema, model } from 'mongoose';
import { Message as IMessage } from '../interfaces/Message';
// Schema
const messageSchema = new Schema<IMessage>({
  content: { type: String },
  imageUrl: { type: String },
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  editTime: { type: Date, required: true, default: Date.now() },
});

const Message = model<IMessage>('Message', messageSchema);
export default Message;
