"use server"

import { sql } from "./db"
import { cookies } from "next/headers"

interface User {
  id: string
  email: string
  name: string
}

async function initializeDatabase() {
  try {
    // Create cultivate_users table
    await sql`
      CREATE TABLE IF NOT EXISTS cultivate_users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create user_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT UNIQUE REFERENCES cultivate_users(id) ON DELETE CASCADE,
        hardiness_zone TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create user_plants table
    await sql`
      CREATE TABLE IF NOT EXISTS user_plants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT REFERENCES cultivate_users(id) ON DELETE CASCADE,
        plant_name TEXT NOT NULL,
        plant_type TEXT,
        sun_exposure TEXT,
        water_needs TEXT,
        hardiness_zones TEXT,
        bloom_season TEXT,
        added_date TIMESTAMP DEFAULT NOW()
      )
    `

    // Create garden_layouts table
    await sql`
      CREATE TABLE IF NOT EXISTS garden_layouts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT REFERENCES cultivate_users(id) ON DELETE CASCADE,
        layout_type TEXT NOT NULL,
        dimensions JSONB,
        plants JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create care_tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS care_tasks (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT REFERENCES cultivate_users(id) ON DELETE CASCADE,
        task_name TEXT NOT NULL,
        task_type TEXT,
        due_date TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
  } catch (error) {
    console.error("[v0] Database initialization error:", error)
  }
}

// Simple password hashing (in production, use bcrypt or argon2)
async function hashPassword(password: string): Promise<string> {
  // For now, using a simple hash. In production, use bcrypt.hash()
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export async function signUp(email: string, password: string, name: string) {
  try {
    await initializeDatabase()

    const existingUser = await sql`
      SELECT id FROM cultivate_users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return { error: "User already exists with this email" }
    }

    const passwordHash = await hashPassword(password)

    const result = await sql`
      INSERT INTO cultivate_users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name
    `

    const userData = result[0] as any
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
    }

    // Create user preferences
    await sql`
      INSERT INTO user_preferences (user_id)
      VALUES (${user.id})
      ON CONFLICT (user_id) DO NOTHING
    `

    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set("cultivate_user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return { user }
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return { error: "Failed to create account" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    await initializeDatabase()

    const result = await sql`
      SELECT id, email, name, password_hash
      FROM cultivate_users 
      WHERE email = ${email}
    `

    if (result.length === 0) {
      return { error: "No account found with this email address. Please sign up first." }
    }

    const userData = result[0] as any

    const isValidPassword = await verifyPassword(password, userData.password_hash)

    if (!isValidPassword) {
      return { error: "Incorrect password. Please try again." }
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
    }

    const cookieStore = await cookies()
    cookieStore.set("cultivate_user", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return { user }
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    return { error: "Failed to sign in" }
  }
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete("cultivate_user")
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("cultivate_user")

    if (!userCookie?.value) {
      return null
    }

    return JSON.parse(userCookie.value) as User
  } catch (error) {
    console.error("[v0] Get current user error:", error)
    return null
  }
}
