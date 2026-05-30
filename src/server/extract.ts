type SerpResult = {
  link?: string
  title?: string
  snippet?: string
  source?: string
}

type SerpData = {
  organic_results?: SerpResult[]
}

export type OrganicUrl = {
  url: string
  title: string
  snippet: string
  source: string
}

export function extractOrganicUrls(serpData: SerpData): OrganicUrl[] {
  const results = Array.isArray(serpData?.organic_results)
    ? serpData.organic_results
    : []

  return results
    .map((r) => ({
      url: r.link ?? '',
      title: r.title ?? '',
      snippet: r.snippet ?? '',
      source: r.source ?? '',
    }))
    .filter((r) => r.url.length > 0)
}
