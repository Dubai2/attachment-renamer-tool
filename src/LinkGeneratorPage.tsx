import { useState, useEffect } from 'react'
import { bitable } from '@lark-base-open/js-sdk'

interface TextField {
  field_id: string
  name: string
  type: number
}

function LinkGeneratorPage({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [textFields, setTextFields] = useState<TextField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string>('')
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    initPlugin()
  }, [])

  const initPlugin = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      setLoading(true)
      setError(null)

      const table = await bitable.base.getActiveTable()
      const fields = await table.getFieldMetaList()

      // 过滤文本字段
      const textFieldList = fields.filter(f => f.type === 1) // type 1 是文本字段
      setTextFields(textFieldList.map(f => ({
        field_id: f.id,
        name: f.name,
        type: f.type
      })))

      if (textFieldList.length > 0) {
        setSelectedFieldId(textFieldList[0].id)
      } else {
        setError('未找到文本字段，请先在表格中创建一个文本列用于存储链接')
      }

      setLoading(false)
    } catch (err) {
      console.error('Initialization failed:', err)
      setError(`初始化失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setLoading(false)
    }
  }

  const generateLinks = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!selectedFieldId) {
      setError('请先选择文本字段')
      return
    }

    try {
      setProcessing(true)
      setError(null)
      setResult(null)

      const table = await bitable.base.getActiveTable()
      const recordIds = await table.getRecordIdList()

      const tableId = table.id
      // 获取视图 ID
      let viewId = ''
      const viewMetaList = await table.getViewMetaList()
      if (viewMetaList.length > 0) {
        viewId = viewMetaList[0].id
      }

      console.log('开始生成链接，总记录数:', recordIds.length)
      console.log('tableId:', tableId, 'viewId:', viewId || '默认视图')

      let successCount = 0
      let failedCount = 0

      // 批量处理，每次处理100条
      const batchSize = 100
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize)
        setProgress({ current: i + batch.length, total: recordIds.length })

        for (const recordId of batch) {
          try {
            // 使用 bitable.bridge.getBitableUrl 生成记录链接
            // fieldId 是必需参数，我们使用空字符串表示不指定特定字段
            const recordLink = await bitable.bridge.getBitableUrl({
              tableId: tableId,
              viewId: viewId,
              recordId: recordId,
              fieldId: '' // 不指定特定字段
            })

            console.log(`记录 ${recordId} 链接:`, recordLink)

            // 写入到指定字段
            await table.setCellValue(recordId, selectedFieldId, recordLink)
            successCount++
          } catch (err) {
            console.error(`记录 ${recordId} 更新失败:`, err)
            failedCount++
          }
        }
      }

      setResult({ success: successCount, failed: failedCount })
      setProgress(null)
      setProcessing(false)
    } catch (err) {
      console.error('生成链接失败:', err)
      setError(`生成链接失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setProcessing(false)
      setProgress(null)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>正在初始化...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <button
          onClick={onBack}
          className="btn btn-back"
          style={{ marginBottom: '16px', padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          ← 返回主页
        </button>
        <h1>生成记录链接</h1>
        <p className="subtitle">为每条记录生成专属链接并写入指定列</p>
      </header>

      <main className="main">
        <div className="form-group">
          <label htmlFor="field-select">选择存储链接的文本列</label>
          <select
            id="field-select"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            disabled={processing}
          >
            {textFields.map((field) => (
              <option key={field.field_id} value={field.field_id}>
                {field.name}
              </option>
            ))}
          </select>
          <span className="hint">生成的链接将写入此列</span>
        </div>

        <button
          onClick={generateLinks}
          disabled={processing || !selectedFieldId || textFields.length === 0}
          className="btn btn-primary btn-large"
        >
          {processing ? '生成中...' : '🔗 生成所有记录链接'}
        </button>

        {progress && (
          <div className="progress-box">
            <div className="progress-text">
              正在处理：{progress.current} / {progress.total}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {result && (
          <div className="result-box">
            <h3>生成完成</h3>
            <p>成功：<strong>{result.success}</strong> 条记录</p>
            {result.failed > 0 && (
              <p>失败：<strong>{result.failed}</strong> 条记录</p>
            )}
          </div>
        )}

        {error && textFields.length > 0 && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>链接格式：https://xxx.feishu.cn/base/[app_token]?table=[table_id]&view=[view_id]&record=[record_id]</p>
      </footer>
    </div>
  )
}

export default LinkGeneratorPage
