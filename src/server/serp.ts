const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY
const BRIGHTDATA_ZONE = process.env.BRIGHTDATA_ZONE ?? 'serp_api1'

type BrightDataOrganicResult = {
  link?: string
  title?: string
  description?: string
  display_link?: string
  source?: string
  global_rank?: number
}

type BrightDataResponse = {
  organic?: BrightDataOrganicResult[]
  body?: string
  [key: string]: unknown
}

export type SerpResponse = {
  organic_results?: {
    link?: string
    title?: string
    snippet?: string
    source?: string
    rank?: number
  }[]
  [key: string]: unknown
}

function normalize(raw: BrightDataResponse): SerpResponse {
  const organic = raw.organic ?? []

  return {
    organic_results: organic.map((r) => ({
      link: r.link,
      title: r.title,
      snippet: r.description,
      source: r.source ?? r.display_link,
      rank: r.global_rank,
    })),
  }
}

export const search = async (query: string): Promise<SerpResponse> => {
  if (!BRIGHTDATA_API_KEY) {
    throw new Error('BRIGHTDATA_API_KEY is not set')
  }

  const res = await fetch('https://api.brightdata.com/request', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${BRIGHTDATA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      zone: BRIGHTDATA_ZONE,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us`,
      format: 'raw',
      data_format: 'parsed_light',
    }),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(
      `Bright Data request failed: ${res.status} ${res.statusText}\n${text}`,
    )
  }

  let data: BrightDataResponse
  try {
    data = JSON.parse(text) as BrightDataResponse
  } catch {
    throw new Error(
      `Bright Data returned non-JSON response. First 500 chars:\n${text.slice(0, 500)}`,
    )
  }

  if (typeof data.body === 'string' && !data.organic) {
    try {
      const nested = JSON.parse(data.body) as BrightDataResponse
      data = nested
    } catch {
      throw new Error(
        `Bright Data returned HTML instead of parsed SERP JSON for query "${query}".`,
      )
    }
  }

  const normalized = normalize(data)

  if (!normalized.organic_results?.length) {
    throw new Error(
      `Bright Data returned no organic results for query "${query}". Raw keys: ${Object.keys(data).join(', ')}`,
    )
  }

  return normalized
}
