import { chromium } from 'playwright'

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

export async function scrapeUrlContent(url: string): Promise<string> {
  const wsEndpoint = process.env.BRIGHTDATA_BROWSER_WS
  if (!wsEndpoint) {
    console.warn('[Scraper] BRIGHTDATA_BROWSER_WS is not set, skipping full page scrape.')
    return ''
  }

  console.log(`[Scraper] Connecting to Scraping Browser for: ${url}`)
  let browser
  try {
    browser = await chromium.connectOverCDP(wsEndpoint)
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Set a reasonable timeout and wait for domcontentloaded
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    const text = await page.evaluate(() => {
      const body = document.body
      if (!body) return ''
      
      // Remove script, style, head, header, footer, nav, etc. to get clean text content
      const toRemove = body.querySelectorAll('script, style, iframe, nav, footer, header')
      toRemove.forEach((el) => el.remove())
      
      return body.innerText || ''
    })
    
    return text.trim()
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${url}:`, error)
    return ''
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

