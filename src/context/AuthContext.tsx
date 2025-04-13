
// This file now re-exports from the refactored auth directory
// for backward compatibility
export { AuthProvider, useAuth } from '@/context/auth';
export type { UserRole, AuthContextType } from '@/context/auth/types';
