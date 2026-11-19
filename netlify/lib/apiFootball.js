// ─── CLIENTE DE API-FOOTBALL (solo servidor) ─────────────────────
// La key vive en la variable de entorno API_FOOTBALL_KEY de Netlify y
// nunca sale de las funciones: el panel no llama a la API directo.
//
// Soporta las dos formas de contratar API-Football:
//   - Directo en api-sports.io (por defecto): header x-apisports-key.
//   - Por RapidAPI: API_FOOTBALL_PROVIDER=rapidapi, header x-rapidapi-key.

const PROVIDERS = {
  apisports: {
    baseUrl: 'https://v3.football.api-sports.io',
    headers: (key) => ({ 'x-apisports-key': key }),
  },
  rapidapi: {
    baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
    headers: (key) => ({
      'x-rapidapi-key': key,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
    }),
  },
}

export class ApiFootballError extends Error {}

// Mínimo entre el arranque de dos requests (~4 por segundo) y esperas
// antes de reintentar cuando la API avisa que nos pasamos del límite.
const MIN_GAP_MS = 250
const RETRY_DELAYS_MS = [1500, 3000, 6000]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function createApiFootballClient(env = process.env) {
  const key = env.API_FOOTBALL_KEY
  if (!key) {
    throw new ApiFootballError('Falta la variable de entorno API_FOOTBALL_KEY en Netlify.')
  }
  const provider = PROVIDERS[env.API_FOOTBALL_PROVIDER || 'apisports']
  if (!provider) {
    throw new ApiFootballError('API_FOOTBALL_PROVIDER tiene que ser "apisports" o "rapidapi".')
  }

  let requestsUsed = 0
  let remainingToday = null
  let nextSlot = 0

  // API-Football corta las ráfagas aunque no se pase del límite por
  // minuto del plan. Espaciamos el arranque de cada request y, si igual
  // responde "Too many requests", reintentamos con espera creciente.
  async function throttle() {
    const now = Date.now()
    const wait = Math.max(0, nextSlot - now)
    nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS
    if (wait) await sleep(wait)
  }

  async function requestOnce(url) {
    await throttle()
    const res = await fetch(url, { headers: provider.headers(key) })
    requestsUsed += 1
    const remaining = res.headers.get('x-ratelimit-requests-remaining')
    if (remaining !== null) remainingToday = Number(remaining)

    if (res.status === 429) return { rateLimited: true }
    if (!res.ok) {
      throw new ApiFootballError(`API-Football respondió ${res.status} en ${url.pathname}`)
    }

    const body = await res.json()
    // La API responde 200 aun con errores (key inválida, plan sin
    // acceso, parámetros mal): vienen en `errors`, como array u objeto.
    const errors = body.errors
    const hasErrors = Array.isArray(errors) ? errors.length > 0 : errors && Object.keys(errors).length > 0
    if (hasErrors) {
      const msg = Array.isArray(errors) ? errors.join(' · ') : Object.values(errors).join(' · ')
      const rateLimited = (!Array.isArray(errors) && 'rateLimit' in errors) || /too many requests/i.test(msg)
      if (rateLimited) return { rateLimited: true, msg }
      throw new ApiFootballError(`API-Football: ${msg}`)
    }
    return { data: body.response }
  }

  async function get(path, params = {}) {
    const url = new URL(provider.baseUrl + path)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })

    for (let attempt = 0; ; attempt++) {
      const result = await requestOnce(url)
      if (!result.rateLimited) return result.data
      if (attempt >= RETRY_DELAYS_MS.length) {
        throw new ApiFootballError(`API-Football: ${result.msg || 'demasiados requests por minuto'} (se reintenta en la próxima pasada)`)
      }
      await sleep(RETRY_DELAYS_MS[attempt])
    }
  }

  return {
    get,
    usage: () => ({ requestsUsed, remainingToday }),
  }
}
