import { chromium, type Browser, type Page } from 'playwright'

export type FetchedArticle = {
  url: string
  title: string
  text: string
}

export async function createBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true })
}

export async function fetchArticle(
  browser: Browser,
  url: string,
): Promise<FetchedArticle | null> {
  const page: Page = await browser.newPage()

  try {
    console.log(`[FETCH] ${url}`)

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })

    await page.evaluate(() => {
      document
        .querySelectorAll(
          'script, style, nav, footer, header, aside, iframe, noscript',
        )
        .forEach((el) => el.remove())
    })

    const title = await page.title()
    const text = await page.locator('body').innerText()

    if (!text || text.length < 500) return null

    return {
      url,
      title,
      text: text.replace(/\n{3,}/g, '\n\n').trim(),
    }
  } catch (err) {
    console.error(`[FETCH FAILED] ${url}`, (err as Error).message)
    return null
  } finally {
    await page.close()
  }
}
