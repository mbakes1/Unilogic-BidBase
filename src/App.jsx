import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ReleaseList from './components/ReleaseList'
import TenderDetail from './components/TenderDetail'

function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check system preference or localStorage for dark mode
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true)
    }
  }, [])

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <Router>
      <div className="font-inter bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <Routes>
          <Route path="/" element={
            <div className="container mx-auto px-4 py-6 max-w-6xl">
              <ReleaseList toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            </div>
          } />
          <Route path="/detail" element={
            <div className="container mx-auto px-4 py-6 max-w-6xl">
              <TenderDetail toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App