import { User } from 'firebase/auth'

export enum UserRole {
  ADMIN = 'admin',
  CONSULTANT = 'consultant',
  FINANCIAL_ANALYST = 'financial_analyst',
  INSTITUTION = 'institution',
  CLIENT = 'client'
}

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  role: UserRole
  organization?: string
  subscription?: {
    plan: string
    status: 'active' | 'inactive' | 'cancelled'
    expiresAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
}