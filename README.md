# 飞书多维表格附件批量重命名插件 - 真·SDK版

> ⚠️ **重要**：本插件必须通过飞书多维表格的"插件"入口打开才能正常使用！不支持浏览器直接访问！

## 功能说明

在飞书多维表格中批量重命名附件字段中的文件，支持：
- 选择任意附件字段
- 设置文件名前缀
- 设置起始序号
- 批量重命名所有附件

## 快速开始

### 方式一：本地开发测试

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

开发服务器会在本地启动，但注意：**本地开发时无法测试SDK功能**，因为SDK需要在飞书多维表格的插件环境中运行。

### 方式二：部署到Vercel（推荐）

1. 点击下方按钮一键部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/attachment-renamer)

或者手动部署：

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 按提示操作，获得一个URL如：https://your-project.vercel.app
```

### 方式三：部署到其他平台

本项目本质是一个静态React应用，可以部署到任何静态托管服务：
- Netlify
- Cloudflare Pages
- GitHub Pages
- 任意HTTP服务器

## 在飞书中使用

### 步骤1：上传插件

1. 打开飞书多维表格
2. 点击左侧边栏的「插件」按钮
3. 选择「添加自定义插件」
4. 在URL输入框中填入你的插件地址（如 `https://your-project.vercel.app`）
5. 点击「添加」

### 步骤2：打开插件

1. 在多维表格中点击「插件」图标
2. 找到你添加的「附件批量重命名」插件
3. 点击打开

### 步骤3：使用插件

1. 选择要操作的附件字段
2. 设置文件名前缀（留空则只改序号）
3. 设置起始序号（默认从1开始）
4. 点击「开始重命名」按钮
5. 等待处理完成

## 技术说明

### 核心技术栈

- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **@lark-base-open/js-sdk** - 飞书Base JS SDK

### SDK使用说明

本插件使用飞书Base JS SDK的核心API：

| API | 用途 |
|-----|------|
| `bitable.base.getActiveTable()` | 获取当前激活的多维表格 |
| `table.getFieldMetaList()` | 获取所有字段元数据 |
| `table.getRecordIdList()` | 获取所有记录ID |
| `field.getValue(recordId)` | 获取指定记录的附件值 |
| `field.setValue(recordId, value)` | 更新指定记录的附件值 |

### 附件字段类型

飞书多维表格中，附件字段的类型编号是 **19**。

### 文件结构

```
attachment-renamer/
├── index.html          # 入口HTML
├── package.json        # 项目配置和依赖
├── tsconfig.json       # TypeScript配置
├── vite.config.ts      # Vite配置
├── README.md           # 本文档
└── src/
    ├── main.tsx        # React入口
    ├── App.tsx         # 主应用组件
    └── App.css         # 样式文件
```

## 常见问题

### Q: 为什么本地打开一片空白？

这是正常的！Base JS SDK 只能在飞书多维表格的插件环境中运行，不支持浏览器直接访问。

**正确做法**：按照「在飞书中使用」的步骤，通过飞书多维表格的插件入口打开。

### Q: 部署后提示跨域错误？

这可能是因为：
1. 插件URL没有正确配置
2. 飞书多维表格不支持该托管平台

推荐使用 Vercel 部署，因为它与飞书有较好的兼容性。

### Q: 如何修改重命名规则？

当前重命名格式为：`{前缀}_{序号}.{原扩展名}`

例如前缀设为 `文件`，起始序号为1，则附件1.jpg会变成 `文件_1.jpg`

### Q: 会覆盖原文件吗？

不会！重命名只修改文件的显示名称（name），文件本体（file_token）保持不变，所以不会影响文件的实际内容。

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 添加新功能

1. 修改 `src/App.tsx` 中的组件逻辑
2. 修改 `src/App.css` 中的样式
3. 测试后重新部署

## 注意事项

- 本插件只修改附件的**显示名称**，不修改文件本体
- 批量操作前建议备份数据
- 如果表格数据量很大（>10000条），处理可能需要较长时间
- 部分托管平台可能有访问限制，建议使用Vercel

## 许可证

MIT License
