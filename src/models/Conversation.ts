import { Schema, model } from 'mongoose';
import { Conversation as IConversation } from '../interfaces/Conversation';
// Schema

import {
  maxUsers,
  minUsers,
  minNameLength,
  maxNameLength,
} from '../interfaces/Conversation';
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
});

conversationSchema.methods.getPreview = async function () {
  let latestMessage = await model('Message')
    .findOne({ conversation: this._id })
    .sort({ creationTime: -1 });

  return {
    name: this.name,
    users: this.users,
    creationTime: this.creationTime,
    userProfile: this.userProfile,
    latestMessage: latestMessage,
  };
};

const Conversation = model<IConversation>('Conversation', conversationSchema);
export default Conversation;
