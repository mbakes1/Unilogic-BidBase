import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'

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

const DocumentItem = ({ document }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 mb-4 flex flex-col sm:flex-row justify-between gap-4">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {escapeHtml(document.title || 'Untitled Document')}
        </h4>
        {document.description && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
            {escapeHtml(document.description)}
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
          <span>Format: {document.format || 'N/A'}</span>
          <span>Published: {formatDateISO(document.datePublished)}</span>
          {document.dateModified && <span>Modified: {formatDateISO(document.dateModified)}</span>}
        </div>
      </div>
      {document.url && (
        <a
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors self-start"
        >
          Download
        </a>
      )}
    </div>
  )
}

const TenderDetail = ({ toggleDarkMode, darkMode }) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ocid = searchParams.get('ocid')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tenderData, setTenderData] = useState(null)
  const [detailCache, setDetailCache] = useState({})

  useEffect(() => {
    if (!ocid) {
      setError('No tender ID provided')
      return
    }
    
    loadTenderDetail()
  }, [ocid])

  const loadTenderDetail = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Check cache first
      if (detailCache[ocid]) {
        setTenderData(detailCache[ocid])
        setLoading(false)
        return
      }
      
      // For Vercel deployment, we'll use the Edge Function
      const response = await fetch(`/api/ocds-releases/release/${ocid}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      setTenderData(data)
      
      // Cache the response
      setDetailCache(prev => ({
        ...prev,
        [ocid]: data
      }))
    } catch (err) {
      console.error('Error loading tender detail:', err)
      setError(`Error loading tender details: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!ocid) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          No tender ID provided
        </div>
      </div>
    )
  }

  const tender = tenderData?.tender || {}
  const tenderPeriod = tender.tenderPeriod || {}
  const procuringEntity = tender.procuringEntity || {}
  const buyer = tenderData?.buyer || {}
  const documents = tender.documents || []

  return (
    <div>
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center"
          >
            ← Back to Listings
          </Link>
          <button 
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm transition-colors"
            onClick={toggleDarkMode}
          >
            Toggle Dark Mode
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 mt-4">Tender Details</h1>
      </header>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Loading tender details...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {tenderData && !loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {escapeHtml(tender.title || 'Untitled Tender')}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs px-3 py-1 rounded-full">
                OCID: {tenderData.ocid}
              </span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-3 py-1 rounded-full">
                ID: {tender.id || 'N/A'}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {escapeHtml(tender.description || 'No description available')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Procuring Entity</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {procuringEntity.name || buyer.name || 'N/A'}
              </p>
              {procuringEntity.id && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ID: {procuringEntity.id}
                </p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Procurement Details</h3>
              <div className="space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Method:</span> {tender.procurementMethodDetails || tender.procurementMethod || 'N/A'}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Category:</span> {tender.mainProcurementCategory || 'N/A'}
                </p>
                {tender.additionalProcurementCategories && tender.additionalProcurementCategories.length > 0 && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Additional Categories:</span> {tender.additionalProcurementCategories.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tender Period</h3>
              <div className="space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Start:</span> {formatDateISO(tenderPeriod.startDate)}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">End:</span> {formatDateISO(tenderPeriod.endDate)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Release Information</h3>
              <div className="space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Date:</span> {formatDateISO(tenderData.date)}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Language:</span> {tenderData.language || 'N/A'}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Tags:</span> {tenderData.tag ? tenderData.tag.join(', ') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {documents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Documents ({documents.length})
              </h3>
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <DocumentItem key={`${doc.id || index}`} document={doc} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TenderDetail