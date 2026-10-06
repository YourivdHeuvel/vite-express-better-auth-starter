import Database from 'better-sqlite3'
import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  database: new Database(process.env.DATABASE_PATH ?? 'sqlite.db'),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
})
