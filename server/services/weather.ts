// Example third-party API client: Open-Meteo (free, no API key needed).
// One file per external service keeps the URL, auth and response mapping in one place.
const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export type CurrentWeather = {
  temperature: number
  windSpeed: number
  time: string
}

// Only the fields we use from Open-Meteo's response.
type OpenMeteoResponse = {
  current: { time: string; temperature_2m: number; wind_speed_10m: number }
}

export async function getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeather> {
  const url = new URL(BASE_URL)
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,wind_speed_10m',
  }).toString()

  // Never wait forever on someone else's server.
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) {
    throw new Error(`Open-Meteo responded ${res.status}: ${await res.text()}`)
  }

  // Map their shape to ours, so the rest of the app doesn't depend on Open-Meteo's field names.
  const data = (await res.json()) as OpenMeteoResponse
  return {
    temperature: data.current.temperature_2m,
    windSpeed: data.current.wind_speed_10m,
    time: data.current.time,
  }
}
