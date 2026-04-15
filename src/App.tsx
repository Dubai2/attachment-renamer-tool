import { useState, useEffect } from 'react'
import { bitable } from '@lark-base-open/js-sdk'

const ATTACHMENT_FIELD_TYPE = 17

interface AttachmentField {
  field_id: string
  name: string
  type: number
}

interface Attachment {
  file_token: string
  name: string
  size?: number
  mime_type?: string
}

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attachmentFields, setAttachmentFields] = useState<AttachmentField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string>('')
  const [prefix, setPrefix] = useState<string>('')
  const [startNumber, setStartNumber] = useState<number>(1)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    initPlugin()
  }, [])

  const initPlugin = async () => {
    try {
      setLoading(true)
      setError(null)
      setDebugInfo('')

      const table = await bitable.base.getActiveTable()
      setDebugInfo(prev => prev + '✓ Got active table\n')

      const fields = await table.getFieldMetaList()
      setDebugInfo(prev => prev + `✓ Got ${fields.length} fields total:\n`)

      // 打印所有字段信息
      const fieldsInfo = fields.map(f => `  - ${f.name} (type: ${f.type})`).join('\n')
      setDebugInfo(prev => prev + fieldsInfo + '\n')

      const attachmentFieldsList = fields.filter(f => f.type === ATTACHMENT_FIELD_TYPE)
      setDebugInfo(prev => prev + `✓ Found ${attachmentFieldsList.length} attachment fields (type=${ATTACHMENT_FIELD_TYPE})\n`)

      if (attachmentFieldsList.length === 0) {
        setError('未找到附件字段，请查看下方调试信息')
        setDebugInfo(prev => prev + '\n❌ 未找到附件字段！')
        setLoading(false)
        return
      }

      setAttachmentFields(attachmentFieldsList.map(f => ({
        field_id: f.id,
        name: f.name,
        type: f.type
      })))
      setDebugInfo(prev => prev + `✓ Set ${attachmentFieldsList.length} attachment fields\n`)

      if (attachmentFieldsList.length > 0) {
        setSelectedFieldId(attachmentFieldsList[0].id)
        setDebugInfo(prev => prev + `✓ Selected default field: ${attachmentFieldsList[0].name}\n`)
      }

      setLoading(false)
    } catch (err) {
      console.error('Initialization failed:', err)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      const errorStack = err instanceof Error ? err.stack : ''
      setDebugInfo(prev => prev + `\n❌ Error: ${errorMsg}\nStack: ${errorStack}`)
      setError(`Initialization failed: ${errorMsg}`)
      setLoading(false)
    }
  }

  const handleRename = async () => {
    if (!selectedFieldId) {
      setError('请先选择附件字段')
      return
    }

    try {
      setProcessing(true)
      setError(null)
      setResult(null)

      const table = await bitable.base.getActiveTable()
      const field = await table.getField(selectedFieldId)
      const recordIds = await table.getRecordIdList()
      const total = recordIds.length

      let successCount = 0
      let failedCount = 0
      let globalIndex = startNumber

      for (let i = 0; i < recordIds.length; i++) {
        const recordId = recordIds[i]

        setProgress({ current: i + 1, total })

        try {
          const attachments = await field.getValue(recordId) as Attachment[] | null

          if (attachments && attachments.length > 0) {
            const renamedAttachments = attachments.map((att) => {
              const originalName = att.name || 'unnamed'
              const lastDot = originalName.lastIndexOf('.')
              const ext = lastDot > 0 ? originalName.substring(lastDot) : ''
              const newName = prefix ? `${prefix}_${globalIndex}${ext}` : `${globalIndex}${ext}`
              globalIndex++

              return {
                file_token: att.file_token,
                name: newName,
                size: att.size,
                mime_type: att.mime_type
              }
            })

            await field.setValue(recordId, renamedAttachments)
            successCount++
          }
        } catch (err) {
          console.error(`Failed to process record ${recordId}:`, err)
          failedCount++
        }
      }

      setResult({ success: successCount, failed: failedCount })
      setProgress(null)
      setProcessing(false)
    } catch (err) {
      console.error('Rename failed:', err)
      setError(`Rename failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setProcessing(false)
      setProgress(null)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>正在初始化插件...</p>
        </div>
      </div>
    )
  }

  if (error && attachmentFields.length === 0) {
    return (
      <div className="container">
        <div className="error-box">
          <h3>错误</h3>
          <p>{error}</p>
          <p className="hint">请确保从飞书多维表格插件的正确入口打开</p>
          <button onClick={initPlugin} className="btn btn-primary">
            重新加载
          </button>
        </div>
        {debugInfo && (
          <div className="debug-box">
            <h4>调试信息</h4>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {debugInfo}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <h1>附件批量重命名</h1>
        <p className="subtitle">飞书多维表格插件</p>
      </header>

      <main className="main">
        <div className="form-group">
          <label htmlFor="field-select">选择附件字段</label>
          <select
            id="field-select"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            disabled={processing}
          >
            {attachmentFields.map((field) => (
              <option key={field.field_id} value={field.field_id}>
                {field.name}
              </option>
            ))}
          </select>
          <span className="field-count">找到 {attachmentFields.length} 个附件字段</span>
        </div>

        <div className="form-group">
          <label htmlFor="prefix">文件名前缀</label>
          <input
            id="prefix"
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="留空则只保留序号"
            disabled={processing}
          />
          <span className="hint">例如：输入 "doc"，结果为 "doc_1.jpg"</span>
        </div>

        <div className="form-group">
          <label htmlFor="start-number">起始序号</label>
          <input
            id="start-number"
            type="number"
            min="0"
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value) || 0)}
            disabled={processing}
          />
          <span className="hint">附件将从该数字开始编号</span>
        </div>

        <button
          onClick={handleRename}
          disabled={processing || !selectedFieldId}
          className="btn btn-primary btn-large"
        >
          {processing ? '处理中...' : '开始重命名'}
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
            <h3>处理完成</h3>
            <p>成功：<strong>{result.success}</strong> 条记录</p>
            {result.failed > 0 && (
              <p>失败：<strong>{result.failed}</strong> 条记录</p>
            )}
          </div>
        )}

        {error && attachmentFields.length > 0 && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>仅修改附件显示名称，不影响原始文件</p>
      </footer>
    </div>
  )
}

export default App
