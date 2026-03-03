import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import process from 'node:process'

const app = express()
const PORT = Number(process.env.PORT || 8787)
const SERPAPI_KEY = process.env.SERPAPI_KEY || ''

app.use(cors())

// Fetch pages from SerpAPI google_scholar_author up to `limit` articles
const fetchAllArticles = async (authorId, limit = 100) => {
  const PAGE_SIZE = Math.min(100, limit) // SerpAPI max is 100 per page
  let allArticles = []
  let authorInfo = null
  let cstart = 0

  while (allArticles.length < limit) {
    const remaining = limit - allArticles.length
    const num = Math.min(PAGE_SIZE, remaining)

    const url = new URL('https://serpapi.com/search.json')
    url.searchParams.set('engine', 'google_scholar_author')
    url.searchParams.set('author_id', authorId)
    url.searchParams.set('hl', 'en')
    url.searchParams.set('num', String(num))
    url.searchParams.set('cstart', String(cstart))
    url.searchParams.set('api_key', SERPAPI_KEY)

    const res = await fetch(url.toString())
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || `SerpAPI returned ${res.status}`)
    }

    const data = await res.json()

    if (!authorInfo && data.author) authorInfo = data.author

    const articles = data.articles || []
    allArticles = allArticles.concat(articles)

    // Stop if last page or no next page
    if (articles.length < num || !data.serpapi_pagination?.next) break

    cstart += num
  }

  return { authorInfo, allArticles: allArticles.slice(0, limit) }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/publications', async (req, res) => {
  if (!SERPAPI_KEY || SERPAPI_KEY === 'your_serpapi_key_here') {
    return res.status(500).json({
      message: 'SerpAPI key is not configured. Set SERPAPI_KEY in your .env file.',
    })
  }

  const userId = String(req.query.userId || '').trim()
  const limit = Math.max(1, Math.min(500, Number.parseInt(req.query.limit, 10) || 100))

  if (!userId) {
    return res.status(400).json({
      message: 'Parameter userId is required. Example: ?userId=4bahYMkAAAAJ',
    })
  }

  try {
    const { authorInfo, allArticles } = await fetchAllArticles(userId, limit)

    const publications = allArticles.map((article, index) => {
      // "publication" field is like "Journal Name, year" or "Conference, start-end, year"
      const pubParts = (article.publication || '').split(',')
      const publisher = pubParts.slice(0, -1).join(',').trim() || '-'
      const year = article.year || pubParts[pubParts.length - 1]?.trim() || '-'

      return {
        no: index + 1,
        title: article.title || '-',
        author: article.authors || '-',
        totalDikutip: article.cited_by?.value ?? 0,
        publishe: publisher,
        tahun: year,
      }
    })

    return res.json({
      author: {
        id: userId,
        name: authorInfo?.name || '-',
        affiliation: authorInfo?.affiliations || '-',
      },
      total: publications.length,
      publications,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({
      message: 'Failed to fetch data from Google Scholar.',
      detail: message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`Scholar API running at http://localhost:${PORT}`)
})
