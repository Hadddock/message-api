import { Schema, model } from 'mongoose';
import { Message as IMessage } from '../interfaces/Message';
import validator from 'validator';
// Schema

import {
  maxContentLength,
  minContentLength,
  maxImageUrlLength,
  minImageUrlLength,
  imageRegex,
} from '../interfaces/Message';

const messageSchema = new Schema<IMessage>({
  deleted: {
    type: Boolean,
    default: false,
  },
  content: {
    type: String,
    min: minContentLength,
    max: maxContentLength,
  },
  imageUrl: {
    type: String,
    min: minImageUrlLength,
    max: maxImageUrlLength,
    validate: {
      validator: function (imageUrl: string) {
        return validator.isURL(imageUrl) && imageRegex.test(imageUrl);
      },
      message: (props) => `${props.value} should be a valid image URL`,
    },
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  readBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      default: [],
    },
  ],
  creationTime: { type: Date, required: true, default: Date.now() },
  editTime: { type: Date },
  deletedAt: { type: Date },
});

messageSchema.pre('save', function (next) {
  if (!this.readBy.includes(this.user)) {
    this.readBy.push(this.user);
  }
  next();
});

const Message = model<IMessage>('Message', messageSchema);
export default Message;
