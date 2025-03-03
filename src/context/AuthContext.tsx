
// This file now re-exports from the refactored auth directory
// for backward compatibility
export { AuthProvider, useAuth } from './auth';
export type { UserRole, AuthContextType } from './auth/types';
