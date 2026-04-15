import { useState } from 'react'
import './AuthPage.css'

interface AuthPageProps {
  onAuthSuccess: (authCode: string) => void
}

function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [authCode, setAuthCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e?.stopPropagation()
    setError('')

    if (!authCode.trim()) {
      setError('请输入授权码')
      return
    }

    setIsLoading(true)

    try {
      // 验证授权码是否有效
      // 尝试获取表格信息来验证授权码
      const metaList = await bitable.getMetaList()
      const tableId = metaList[0]?.id

      if (tableId) {
        // 授权码有效，保存到 localStorage
        localStorage.setItem('feishu_auth_code', authCode.trim())
        onAuthSuccess(authCode.trim())
      }
    } catch (err) {
      setError('授权码无效或已过期，请检查后重试')
      console.error('授权码验证失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔐 授权验证</h2>
          <p className="auth-subtitle">请输入飞书多维表格授权码</p>
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label htmlFor="authCode">授权码</label>
            <input
              type="text"
              id="authCode"
              value={authCode}
              onChange={(e) => {
                e?.stopPropagation()
                setAuthCode(e.target.value)
              }}
              placeholder="请粘贴授权码"
              disabled={isLoading}
            />
            <p className="form-hint">
              授权码可在多维表格中获取，用于读取和编辑表格数据
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            className="auth-submit-btn"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '验证中...' : '提交授权码'}
          </button>
        </div>

        <div className="auth-footer">
          <p>📌 授权码是隐私信息，请勿对外传播</p>
          <p>💡 授权码过期后需要重新提交</p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
