import { useState, useEffect } from 'react'
import HomePage from './HomePage'
import RenamePage from './RenamePage'
import LinkGeneratorPage from './LinkGeneratorPage'
import AuthPage from './AuthPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home') // 'home', 'rename', 'link', 'auth'

  // 初始化时检查授权码
  useEffect(() => {
    const savedAuthCode = localStorage.getItem('feishu_auth_code')
    if (!savedAuthCode) {
      setCurrentPage('auth')
    }
  }, [])

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const handleBack = () => {
    setCurrentPage('home')
  }

  const handleAuthSuccess = (_code: string) => {
    // 授权成功，保存到 localStorage（已在 AuthPage 中保存）
    setCurrentPage('home')
  }

  const handleLogout = () => {
    localStorage.removeItem('feishu_auth_code')
    setCurrentPage('auth')
  }

  switch (currentPage) {
    case 'auth':
      return <AuthPage onAuthSuccess={handleAuthSuccess} />
    case 'home':
      return <HomePage onNavigate={handleNavigate} onLogout={handleLogout} />
    case 'rename':
      return <RenamePage onBack={handleBack} />
    case 'link':
      return <LinkGeneratorPage onBack={handleBack} />
    default:
      return <HomePage onNavigate={handleNavigate} onLogout={handleLogout} />
  }
}

export default App
