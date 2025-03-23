
import { createContext } from "react";
import { AuthContextType } from "./types";

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  rolesWithNames: [],
  loading: true,
  signOut: async () => {},
  hasRole: () => false,
  refreshProfileData: async () => {},
});
