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
        setError('No attachment field found. See debug info below for details.')
        setDebugInfo(prev => prev + '\n❌ No attachment field type 19 found in table!')
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
      setError('Please select an attachment field first')
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
          <p>Initializing plugin...</p>
        </div>
      </div>
    )
  }

  if (error && attachmentFields.length === 0) {
    return (
      <div className="container">
        <div className="error-box">
          <h3>Error</h3>
          <p>{error}</p>
          <p className="hint">Please ensure this plugin is opened from the Feishu Bitable plugin entry</p>
          <button onClick={initPlugin} className="btn btn-primary">
            Reload
          </button>
        </div>
        {debugInfo && (
          <div className="debug-box">
            <h4>Debug Information</h4>
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
        <h1>Attachment Batch Rename</h1>
        <p className="subtitle">Feishu Bitable Plugin</p>
      </header>

      <main className="main">
        <div className="form-group">
          <label htmlFor="field-select">Select Attachment Field</label>
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
          <span className="field-count">{attachmentFields.length} attachment fields found</span>
        </div>

        <div className="form-group">
          <label htmlFor="prefix">File Name Prefix</label>
          <input
            id="prefix"
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="Leave empty to keep only the serial number"
            disabled={processing}
          />
          <span className="hint">e.g. enter "doc", result is "doc_1.jpg"</span>
        </div>

        <div className="form-group">
          <label htmlFor="start-number">Start Number</label>
          <input
            id="start-number"
            type="number"
            min="0"
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value) || 0)}
            disabled={processing}
          />
          <span className="hint">Attachments will be numbered from this value</span>
        </div>

        <button
          onClick={handleRename}
          disabled={processing || !selectedFieldId}
          className="btn btn-primary btn-large"
        >
          {processing ? 'Processing...' : 'Start Rename'}
        </button>

        {progress && (
          <div className="progress-box">
            <div className="progress-text">
              Processing: {progress.current} / {progress.total}
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
            <h3>Processing Complete</h3>
            <p>Success: <strong>{result.success}</strong> records</p>
            {result.failed > 0 && (
              <p>Failed: <strong>{result.failed}</strong> records</p>
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
        <p>Only modifies attachment display name, does not affect the original file</p>
      </footer>
    </div>
  )
}

export default App
