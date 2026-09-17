// Shared shape for the access domain core. Kept to exactly the fields the domain rules need (id
// and name for name matching via checkNameCollision, isAdmin for the last-Admin guard on
// removal): callers (the db layer) may know more about a User, but the domain core doesn't.
export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}
