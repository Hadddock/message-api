import { Schema, model } from 'mongoose';
import { Message as IMessage } from '../interfaces/Message';
import validator from 'validator';
// Schema

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
  postTime: { type: Date, required: true, default: Date.now() },
  editTime: { type: Date },
});

const Message = model<IMessage>('Message', messageSchema);
export default Message;
