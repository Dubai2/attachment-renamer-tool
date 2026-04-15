import { useState } from 'react'
import HomePage from './HomePage'
import RenamePage from './RenamePage'
import LinkGeneratorPage from './LinkGeneratorPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home') // 'home', 'rename', 'link'

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const handleBack = () => {
    setCurrentPage('home')
  }

  switch (currentPage) {
    case 'home':
      return <HomePage onNavigate={handleNavigate} />
    case 'rename':
      return <RenamePage onBack={handleBack} />
    case 'link':
      return <LinkGeneratorPage onBack={handleBack} />
    default:
      return <HomePage onNavigate={handleNavigate} />
  }
}

export default App
