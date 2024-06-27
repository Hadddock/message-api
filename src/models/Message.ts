import { Schema, model } from 'mongoose';
import { Message as IMessage } from '../interfaces/Message';
// Schema
const messageSchema = new Schema<IMessage>({
  postTime: { type: Date, required: true, default: Date.now() },
  editTime: { type: Date, required: true },
});

const Message = model<IMessage>('Message', messageSchema);
export default Message;
