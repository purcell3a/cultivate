"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  signUp as signUpAction,
  signIn as signInAction,
  signOut as signOutAction,
  getCurrentUser,
} from "./auth-actions"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from server on mount
  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setIsLoading(false)
    })
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    const result = await signUpAction(email, password, name)

    if (result.error) {
      throw new Error(result.error)
    }

    if (result.user) {
      setUser(result.user)
    }
  }

  const signIn = async (email: string, password: string) => {
    const result = await signInAction(email, password)

    if (result.error) {
      throw new Error(result.error)
    }

    if (result.user) {
      setUser(result.user)
    }
  }

  const signOut = async () => {
    await signOutAction()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
