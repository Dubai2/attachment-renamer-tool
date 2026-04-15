function HomePage({ onNavigate, onLogout }: { onNavigate: (page: string) => void; onLogout: () => void }) {
  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>飞书多维表格工具箱</h1>
            <p className="subtitle">选择你需要的功能</p>
          </div>
          <button className="logout-btn" onClick={(e) => {
            e?.stopPropagation()
            onLogout()
          }}>
            退出登录
          </button>
        </div>
      </header>

      <main className="main">
        <div className="feature-grid">
          <div
            className="feature-card"
            onClick={() => onNavigate('rename')}
            role="button"
            tabIndex={0}
          >
            <div className="feature-icon">🔧</div>
            <h3 className="feature-title">批量重命名附件</h3>
            <p className="feature-desc">批量修改附件文件名，支持自定义前缀和序号</p>
          </div>

          <div
            className="feature-card"
            onClick={() => onNavigate('link')}
            role="button"
            tabIndex={0}
          >
            <div className="feature-icon">🔗</div>
            <h3 className="feature-title">生成记录链接</h3>
            <p className="feature-desc">为每条记录生成专属链接并写入指定列</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>更多功能正在开发中...</p>
      </footer>
    </div>
  )
}

export default HomePage
