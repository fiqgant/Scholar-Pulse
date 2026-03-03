import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import BlurText from './components/BlurText'
import ColorBends from './components/ColorBends'
import SpotlightCard from './components/SpotlightCard'
import ShinyText from './components/ShinyText'
import './App.css'

// Scholar Pulse — Google Scholar Data Extractor

const initialError = ''

const parseScholarUserId = (inputValue, mode) => {
  const trimmedValue = inputValue.trim()

  if (!trimmedValue) {
    return {
      value: '',
      error:
        mode === 'link'
          ? 'Google Scholar profile link is required.'
          : 'Google Scholar User ID is required.',
    }
  }

  if (mode === 'id') {
    return { value: trimmedValue, error: '' }
  }

  try {
    const normalizedUrl = /^https?:\/\//i.test(trimmedValue)
      ? trimmedValue
      : `https://${trimmedValue}`
    const scholarUrl = new URL(normalizedUrl)
    const isScholarHost = scholarUrl.hostname.includes('scholar.google.')
    const userParam = scholarUrl.searchParams.get('user')

    if (!isScholarHost || !userParam) {
      return {
        value: '',
        error:
          'Invalid link. Make sure the Google Scholar profile link contains the user=... parameter.',
      }
    }

    return { value: userParam.trim(), error: '' }
  } catch {
    return {
      value: '',
      error:
        'Invalid link format. Example: https://scholar.google.com/citations?user=XXXX&hl=en',
    }
  }
}

function App() {
  const [inputMode, setInputMode] = useState('id')
  const [userId, setUserId] = useState('')
  const [rows, setRows] = useState([])
  const [authorName, setAuthorName] = useState('-')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [lastFetchedUserId, setLastFetchedUserId] = useState('')

  const totalCitation = useMemo(
    () => rows.reduce((sum, item) => sum + (Number(item.totalDikutip) || 0), 0),
    [rows],
  )

  const fetchPublications = async (event) => {
    event.preventDefault()

    const resolvedUserId = parseScholarUserId(userId, inputMode)

    if (!resolvedUserId.value) {
      setError(resolvedUserId.error)
      return
    }

    try {
      setLoading(true)
      setError(initialError)

      const response = await fetch(
        `/api/publications?userId=${encodeURIComponent(resolvedUserId.value)}&limit=500`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch data.')
      }

      setAuthorName(data?.author?.name || '-')
      setRows(data?.publications || [])
      setLastFetchedUserId(resolvedUserId.value)
    } catch (fetchError) {
      setRows([])
      setAuthorName('-')
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'An error occurred while fetching data.',
      )
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!rows.length) {
      setError('No data to export yet.')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Publications')
    XLSX.writeFile(
      workbook,
      `scholar-publications-${lastFetchedUserId || 'author'}.xlsx`,
    )
  }

  return (
    <div className="page-wrap">
      {/* Full-screen ColorBends background */}
      <div className="bg-canvas">
        <ColorBends
          rotation={45}
          speed={0.2}
          colors={['#5227FF', '#9effb6', '#002db3']}
          transparent={false}
          autoRotate={0}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.1}
        />
      </div>

      {/* Overlay to darken bg for readability */}
      <div className="bg-overlay" />

      {/* Full-screen loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="loading-ring" />
            <p className="loading-text">Fetching publications...</p>
            <p className="loading-sub">This may take a while — please wait</p>
          </div>
        </div>
      )}

      <main className="main-content">
        {/* Hero */}
        <header className="hero">
          <div className="badge">
            <ShinyText text="✦ Academic Data Extractor" speed={4} />
          </div>
          <BlurText
            text="Scholar Pulse"
            className="hero-blur-title"
            delay={120}
            animateBy="words"
            direction="top"
          />
          <p className="subtitle">
            Extract &amp; export Google Scholar publications — Title, Authors, Citations, Publisher &amp; Year — to Excel in one click.
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="mode-toggle" role="radiogroup" aria-label="Input Mode">
          <button
            type="button"
            className={inputMode === 'id' ? 'mode-btn active' : 'mode-btn'}
            onClick={() => {
              setInputMode('id')
              setError(initialError)
            }}
          >
            Scholar ID
          </button>
          <button
            type="button"
            className={inputMode === 'link' ? 'mode-btn active' : 'mode-btn'}
            onClick={() => {
              setInputMode('link')
              setError(initialError)
            }}
          >
            Profile Link
          </button>
        </div>

        {/* Search Form */}
        <form className="search-form" onSubmit={fetchPublications}>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder={
              inputMode === 'id'
                ? 'e.g. 4bahYMkAAAAJ'
                : 'e.g. https://scholar.google.com/citations?user=4bahYMkAAAAJ&hl=en'
            }
            aria-label={
              inputMode === 'id' ? 'Google Scholar User ID' : 'Google Scholar Profile Link'
            }
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Fetching...
              </span>
            ) : (
              'Fetch Data'
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportToExcel}
            disabled={!rows.length || loading}
          >
            ↓ Export Excel
          </button>
        </form>

        {error ? <p className="error-box">{error}</p> : null}

        {/* Stats */}
        <section className="stats-row">
          <SpotlightCard spotlightColor="rgba(158,255,182,0.3)">
            <p className="stat-label">Author</p>
            <h3 className="stat-value">{authorName}</h3>
          </SpotlightCard>
          <SpotlightCard spotlightColor="rgba(158,255,182,0.3)">
            <p className="stat-label">Publications</p>
            <h3 className="stat-value">{rows.length}</h3>
          </SpotlightCard>
          <SpotlightCard spotlightColor="rgba(158,255,182,0.3)">
            <p className="stat-label">Total Citations</p>
            <h3 className="stat-value">{totalCitation}</h3>
          </SpotlightCard>
        </section>

        {/* Table */}
        <section className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Title</th>
                <th>Authors</th>
                <th>Citations</th>
                <th>Publisher</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((item) => (
                  <tr key={`${item.no}-${item.title}`}>
                    <td>{item.no}</td>
                    <td>{item.title}</td>
                    <td>{item.author}</td>
                    <td>{item.totalDikutip}</td>
                    <td>{item.publishe}</td>
                    <td>{item.tahun}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No data yet. Enter a Scholar ID or Profile Link and click &quot;Fetch Data&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}

export default App
