import { Schema, model } from 'mongoose';
import { Conversation as IConversation } from '../interfaces/Conversation';
// Schema

const maxUsers = 12;
const minUsers = 2;

const minNameLength = 2;
const maxNameLength = 100;
const conversationSchema = new Schema<IConversation>({
  name: {
    type: String,
    required: true,
    min: minNameLength,
    max: maxNameLength,
  },
  users: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    validate: {
      validator: function (users: Array<any>) {
        return users.length >= minUsers && users.length <= maxUsers;
      },
      message: (props) =>
        `${props.value} should have between ${minUsers} and ${maxUsers} users`,
    },
  },
  creationTime: { type: Date, required: true, default: Date.now() },
  latestMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
});

const Conversation = model<IConversation>('Conversation', conversationSchema);
export default Conversation;
