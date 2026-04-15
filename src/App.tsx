import { useState, useEffect } from 'react'
import { bitable, FieldType } from '@lark-base-open/js-sdk'

// 附件字段类型编号
const ATTACHMENT_FIELD_TYPE = 19

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
  // 状态
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attachmentFields, setAttachmentFields] = useState<AttachmentField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string>('')
  const [prefix, setPrefix] = useState<string>('')
  const [startNumber, setStartNumber] = useState<number>(1)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)

  // 初始化：获取当前表格的附件字段
  useEffect(() => {
    initPlugin()
  }, [])

  const initPlugin = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. 获取当前激活的表格
      const table = await bitable.base.getActiveTable()

      // 2. 获取所有字段，找出附件字段
      const fields = await table.getFieldMetaList()
      const attachmentFieldsList = fields.filter(f => f.type === ATTACHMENT_FIELD_TYPE)

      if (attachmentFieldsList.length === 0) {
        setError('当前表格没有附件字段')
        setLoading(false)
        return
      }

      setAttachmentFields(attachmentFieldsList.map(f => ({
        field_id: f.id,
        name: f.name,
        type: f.type
      })))

      // 默认选择第一个附件字段
      if (attachmentFieldsList.length > 0) {
        setSelectedFieldId(attachmentFieldsList[0].id)
      }

      setLoading(false)
    } catch (err) {
      console.error('初始化失败:', err)
      setError(`初始化失败: ${err instanceof Error ? err.message : '未知错误}`)
      setLoading(false)
    }
  }

  // 重命名附件
  const handleRename = async () => {
    if (!selectedFieldId) {
      setError('请先选择一个附件字段')
      return
    }

    try {
      setProcessing(true)
      setError(null)
      setResult(null)

      // 1. 获取当前表格
      const table = await bitable.base.getActiveTable()

      // 2. 获取所选字段
      const field = await table.getField(selectedFieldId)

      // 3. 获取所有记录ID
      const recordIds = await table.getRecordIdList()
      const total = recordIds.length

      let successCount = 0
      let failedCount = 0
      let globalIndex = startNumber

      // 4. 遍历每条记录
      for (let i = 0; i < recordIds.length; i++) {
        const recordId = recordIds[i]

        setProgress({ current: i + 1, total })

        try {
          // 获取该记录的附件值
          const attachments = await field.getValue(recordId) as Attachment[] | null

          if (attachments && attachments.length > 0) {
            // 重命名每个附件
            const renamedAttachments = attachments.map((att) => {
              // 获取原文件名和扩展名
              const originalName = att.name || '未命名'
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

            // 更新字段值
            await field.setValue(recordId, renamedAttachments)
            successCount++
          }
        } catch (err) {
          console.error(`处理记录 ${recordId} 失败:`, err)
          failedCount++
        }
      }

      setResult({ success: successCount, failed: failedCount })
      setProgress(null)
      setProcessing(false)
    } catch (err) {
      console.error('重命名失败:', err)
      setError(`重命名失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setProcessing(false)
      setProgress(null)
    }
  }

  // 渲染加载状态
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

  // 渲染错误状态
  if (error && attachmentFields.length === 0) {
    return (
      <div className="container">
        <div className="error-box">
          <h3>⚠️ 出错了</h3>
          <p>{error}</p>
          <p className="hint">提示：确保从飞书多维表格的「插件」入口打开本插件</p>
          <button onClick={initPlugin} className="btn btn-primary">
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <h1>📎 附件批量重命名</h1>
        <p className="subtitle">飞书多维表格插件</p>
      </header>

      <main className="main">
        {/* 字段选择 */}
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
          <span className="field-count">共 {attachmentFields.length} 个附件字段</span>
        </div>

        {/* 前缀设置 */}
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
          <span className="hint">例如：填写"文档"，结果为"文档_1.jpg"</span>
        </div>

        {/* 起始序号 */}
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
          <span className="hint">附件将在此基础上累加编号</span>
        </div>

        {/* 重命名按钮 */}
        <button
          onClick={handleRename}
          disabled={processing || !selectedFieldId}
          className="btn btn-primary btn-large"
        >
          {processing ? '处理中...' : '🚀 开始重命名'}
        </button>

        {/* 进度显示 */}
        {progress && (
          <div className="progress-box">
            <div className="progress-text">
              正在处理: {progress.current} / {progress.total}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 结果显示 */}
        {result && (
          <div className="result-box">
            <h3>✅ 处理完成</h3>
            <p>成功处理: <strong>{result.success}</strong> 条记录</p>
            {result.failed > 0 && (
              <p>失败: <strong>{result.failed}</strong> 条记录</p>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && attachmentFields.length > 0 && (
          <div className="error-box">
            <p>{error}</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>仅修改附件显示名称，不影响文件本体</p>
      </footer>
    </div>
  )
}

export default App
