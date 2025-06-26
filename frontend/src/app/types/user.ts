export interface User {
  userId: string;
  name: string;
  avatar: string | null;
  active: boolean; // whether the user has an active subscription
}
