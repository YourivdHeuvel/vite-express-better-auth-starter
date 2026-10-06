import { createAuthClient } from 'better-auth/react'

// Same origin: in dev Vite proxies /api to Express, in production Express serves the client.
export const authClient = createAuthClient()

export const { signIn, signUp, signOut, useSession } = authClient
