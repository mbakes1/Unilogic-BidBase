import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const formatDateISO = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return dateString
  }
}

const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const ReleaseCard = ({ release }) => {
  const tender = release.tender || {}
  const tenderPeriod = tender.tenderPeriod || {}
  const procuringEntity = tender.procuringEntity || {}
  const buyer = release.buyer || {}
  
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate(`/detail?ocid=${encodeURIComponent(release.ocid)}`)
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={handleClick}
    >
      {tender.description && (
        <div 
          className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: escapeHtml(tender.description) }}
        />
      )}
      
      <div className="space-y-3">
        <div className="font-medium text-gray-900 dark:text-white">
          {procuringEntity.name || buyer.name || 'N/A'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {tender.procurementMethodDetails || tender.procurementMethod || 'N/A'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          {formatDateISO(tenderPeriod.startDate)} - {formatDateISO(tenderPeriod.endDate)}
        </div>
      </div>
    </div>
  )
}

const ReleaseList = ({ toggleDarkMode, darkMode }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReleases, setTotalReleases] = useState(0)
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState('2025-07-19')
  const [pageSize, setPageSize] = useState(50)
  const [searchCache, setSearchCache] = useState({})

  const navigate = useNavigate()

  const loadReleases = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        PageNumber: currentPage,
        PageSize: pageSize,
        ...(search && { search }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      }).toString()
      
      const cacheKey = params
      
      // Check cache first
      if (searchCache[cacheKey]) {
        const cachedData = searchCache[cacheKey]
        setReleases(cachedData.releases || [])
        setTotalReleases(cachedData.releases?.length || 0)
        setLoading(false)
        return
      }
      
      // For Vercel deployment, we'll use the Edge Function
      const response = await fetch(`/api/ocds-releases?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const releasesData = data.releases || []
      
      setReleases(releasesData)
      setTotalReleases(releasesData.length)
      
      // Cache the response
      setSearchCache(prev => ({
        ...prev,
        [cacheKey]: data
      }))
    } catch (err) {
      console.error('Error loading releases:', err)
      setError(`Error loading data: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, search, dateFrom, dateTo, searchCache])

  useEffect(() => {
    loadReleases()
  }, [loadReleases])

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    // Reset to first page when search changes
    setCurrentPage(1)
  }

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    // Reset to first page when page size changes
    setCurrentPage(1)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1)
  }

  return (
    <div>
      <header className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">OCDS Releases</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">South African Government Procurement Data</p>
        <button 
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm transition-colors"
          onClick={toggleDarkMode}
        >
          Toggle Dark Mode
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label htmlFor="searchInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              id="searchInput"
              placeholder="Search releases..."
              value={search}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Size</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
              <option value={10000}>10000</option>
              <option value={20000}>20000</option>
            </select>
          </div>
          <div>
            <button
              onClick={loadReleases}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
            >
              Load Releases
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
        <span>Total: {totalReleases}</span>
        <span>Page: {currentPage}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {releases.length > 0 ? (
          releases.map((release, index) => (
            <ReleaseCard key={`${release.ocid}-${index}`} release={release} />
          ))
        ) : !loading && !error ? (
          <div className="col-span-full bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">
            No releases found for the selected criteria.
          </div>
        ) : null}
      </div>

      <div className="flex justify-center space-x-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={handleNextPage}
          disabled={releases.length < pageSize}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default ReleaseList