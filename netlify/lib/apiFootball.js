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

  async function get(path, params = {}) {
    const url = new URL(provider.baseUrl + path)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })

    const res = await fetch(url, { headers: provider.headers(key) })
    requestsUsed += 1
    const remaining = res.headers.get('x-ratelimit-requests-remaining')
    if (remaining !== null) remainingToday = Number(remaining)

    if (!res.ok) {
      throw new ApiFootballError(`API-Football respondió ${res.status} en ${path}`)
    }

    const body = await res.json()
    // La API responde 200 aun con errores (key inválida, plan sin
    // acceso, parámetros mal): vienen en `errors`, como array u objeto.
    const errors = body.errors
    const hasErrors = Array.isArray(errors) ? errors.length > 0 : errors && Object.keys(errors).length > 0
    if (hasErrors) {
      const msg = Array.isArray(errors) ? errors.join(' · ') : Object.values(errors).join(' · ')
      throw new ApiFootballError(`API-Football: ${msg}`)
    }
    return body.response
  }

  return {
    get,
    usage: () => ({ requestsUsed, remainingToday }),
  }
}
