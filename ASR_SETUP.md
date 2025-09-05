# ASR 语音识别组件使用说明

## 组件概述

已成功创建了一个实时ASR（自动语音识别）组件，基于讯飞语音识别服务。该组件提供了完整的语音转文字功能。

## 文件结构

```
src/
├── components/
│   ├── ASRComponent.tsx          # 主要ASR组件
│   └── ASRComponent.module.css   # 组件样式
├── types/
│   └── asr.ts                   # ASR相关类型定义
├── utils/
│   └── asr.ts                   # ASR工具函数
└── app/
    └── page.tsx                 # 已集成ASR组件的主页面
```

## 功能特性

1. **实时语音识别** - 支持实时语音转文字
2. **状态管理** - 完整的连接状态跟踪（准备、连接中、录音中、关闭中、已关闭）
3. **错误处理** - 完善的错误提示和处理机制
4. **配置面板** - 可配置AppId、ApiKey、采样率等参数
5. **结果管理** - 支持复制、清空识别结果
6. **视觉反馈** - 录音状态指示器和波形动画

## 使用前准备

### 1. 安装依赖
组件已自动安装了必要的依赖：
```bash
npm install crypto-js @types/crypto-js
```

### 2. 获取讯飞语音识别服务密钥
- 访问 [讯飞开放平台](https://www.xfyun.cn/)
- 注册账号并创建应用
- 获取 `AppId` 和 `API Key`

### 3. 下载必要的脚本文件
您需要下载以下JavaScript文件并放在项目的public目录下：

1. **hmac-sha256.js** - HMAC SHA256加密库
2. **HmacSHA1.js** - HMAC SHA1加密库  
3. **md5.js** - MD5哈希库
4. **enc-base64-min.js** - Base64编码库
5. **index.umd.js** - RecorderManager录音管理器

这些文件通常可以从讯飞语音识别SDK中获取，或从相关CDN下载。

### 4. 在Next.js中引入脚本
在 `src/app/layout.tsx` 中添加脚本引用：

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        <script src="/hmac-sha256.js"></script>
        <script src="/HmacSHA1.js"></script>
        <script src="/md5.js"></script>
        <script src="/enc-base64-min.js"></script>
        <script src="/index.umd.js"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## 配置使用

### 1. 配置ASR参数
在 `src/app/page.tsx` 中更新ASR配置：

```tsx
const [asrConfig] = useState<ASRConfig>({
  appId: 'YOUR_APP_ID',        // 替换为您的AppId
  apiKey: 'YOUR_API_KEY',      // 替换为您的API Key
  sampleRate: 16000,
  frameSize: 1280
});
```

### 2. 使用组件
组件已集成到主页面中，点击头部的"语音识别"按钮即可展开ASR面板。

## 组件API

### Props
```tsx
interface ASRComponentProps {
  config: ASRConfig;                    // ASR配置
  onResult?: (text: string) => void;    // 识别结果回调
  onError?: (error: string) => void;    // 错误回调
  onStatusChange?: (status: ASRStatus) => void; // 状态变更回调
  className?: string;                   // 自定义样式类
}
```

### 配置类型
```tsx
interface ASRConfig {
  appId: string;        // 讯飞AppId
  apiKey: string;       // 讯飞API Key
  sampleRate?: number;  // 采样率，默认16000
  frameSize?: number;   // 帧大小，默认1280
}
```

### 状态类型
```tsx
type ASRStatus = 'UNDEFINED' | 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
```

## 使用流程

1. 点击主页面头部的"语音识别"按钮展开ASR面板
2. 在配置面板中输入您的AppId和API Key
3. 点击录音按钮开始语音识别
4. 说话时，识别结果会实时显示在结果区域
5. 再次点击按钮停止录音
6. 可以复制或清空识别结果

## 注意事项

1. **浏览器兼容性** - 需要支持WebSocket和getUserMedia API的现代浏览器
2. **HTTPS要求** - 录音功能需要在HTTPS环境下使用
3. **麦克风权限** - 首次使用时需要授权麦克风访问权限
4. **网络连接** - 需要稳定的网络连接到讯飞服务器

## 故障排除

### 常见问题

1. **"RecorderManager 未加载"错误**
   - 检查是否正确引入了所有必需的脚本文件
   - 确保脚本文件路径正确

2. **"浏览器不支持WebSocket"错误**
   - 使用现代浏览器（Chrome、Firefox、Safari、Edge等）

3. **"浏览器不支持录音功能"错误**
   - 确保在HTTPS环境下使用
   - 检查浏览器是否支持getUserMedia API

4. **"连接失败"错误**
   - 检查AppId和API Key是否正确
   - 确保网络连接正常
   - 检查讯飞服务状态

### 调试建议

1. 打开浏览器开发者工具查看控制台错误
2. 检查网络选项卡查看WebSocket连接状态
3. 确认所有脚本文件都已正确加载

## 扩展功能

您可以根据需要扩展以下功能：

1. **多语言支持** - 修改WebSocket URL支持不同语言
2. **音频格式配置** - 调整采样率和编码格式
3. **结果后处理** - 添加标点符号、语音命令识别等
4. **历史记录** - 保存识别历史
5. **语音唤醒** - 添加关键词唤醒功能

## 技术支持

如有问题，请检查：
1. 讯飞开放平台文档
2. 浏览器控制台错误信息
3. 网络连接状态
4. 脚本文件加载状态
