import path from 'node:path'
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node'
import express from 'express'
import { auth } from './auth.ts'
import { getCurrentWeather } from './services/weather.ts'

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

// Example third-party API call: the browser calls us, we call Open-Meteo.
// Keeping external calls on the server keeps API keys secret and lets us validate input.
app.get('/api/weather', async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Defaults to Amsterdam; ?lat=..&lon=.. picks another place.
  const latitude = Number(req.query.lat ?? 52.37)
  const longitude = Number(req.query.lon ?? 4.89)
  if (!(Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180)) {
    res.status(400).json({ error: 'lat must be between -90 and 90, lon between -180 and 180' })
    return
  }

  try {
    res.json(await getCurrentWeather(latitude, longitude))
  } catch (error) {
    // Log the details for us, send a generic message to the browser.
    console.error('Weather lookup failed:', error)
    res.status(502).json({ error: 'Weather service unavailable, try again later' })
  }
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
