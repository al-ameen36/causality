type SerpResult = {
  link?: string
  title?: string
  snippet?: string
  source?: string
  rank?: number
}

type SerpData = {
  organic_results?: SerpResult[]
}

export type OrganicUrl = {
  url: string
  title: string
  snippet: string
  source: string
  rank?: number
}

export function extractOrganicUrls(serpData: SerpData): OrganicUrl[] {
  const results = Array.isArray(serpData?.organic_results)
    ? serpData.organic_results
    : []

  return results
    .filter((r) => r?.link)
    .map((r) => ({
      url: r.link!,
      title: r.title ?? '',
      snippet: r.snippet ?? '',
      source: r.source ?? '',
      rank: r.rank,
    }))
}
