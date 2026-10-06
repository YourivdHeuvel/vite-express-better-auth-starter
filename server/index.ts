import path from 'node:path'
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node'
import express from 'express'
import { auth } from './auth.ts'

const app = express()
const port = Number(process.env.PORT ?? 3000)

// Better Auth must be mounted before express.json(), which would consume the body.
app.all('/api/auth/{*any}', toNodeHandler(auth))

app.use(express.json())

app.get('/api/me', async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  res.json(session)
})

if (process.env.NODE_ENV === 'production') {
  const clientDir = path.resolve(import.meta.dirname, '../client')
  app.use(express.static(clientDir))
  app.get('/{*any}', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
