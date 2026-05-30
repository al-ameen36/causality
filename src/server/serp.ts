const SERPAPI_KEY = process.env.SERPAPI_KEY
const SERPAPI_URL = process.env.SERPAPI_URL

export type SerpResponse = {
  organic_results?: {
    link?: string
    title?: string
    snippet?: string
    source?: string
  }[]
  [key: string]: unknown
}

export const search = async (
  query: string,
  engine: string = 'google',
): Promise<SerpResponse> => {
  const params = new URLSearchParams({
    engine,
    q: query,
    api_key: SERPAPI_KEY ?? '',
  })

  const res = await fetch(`${SERPAPI_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${SERPAPI_KEY}`,
    },
  })

  return res.json() as Promise<SerpResponse>
}
