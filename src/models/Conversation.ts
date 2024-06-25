import { Schema, model } from 'mongoose';
import { Conversation as IConversation } from '../interfaces/Conversation';
// Schema
const conversationSchema = new Schema<IConversation>({
  name: { type: String, required: true },
  users: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  creationTime: { type: Date, required: true, default: Date.now() },
  latestMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
});

const Conversation = model<IConversation>('Conversation', conversationSchema);
export default Conversation;
