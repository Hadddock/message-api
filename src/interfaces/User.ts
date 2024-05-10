export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  avatar?: string;
  userProfile?: Object;
  bio: string;
  joinTime: Date;
  pinnedConversations?: [];
}
