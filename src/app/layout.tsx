import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

// 配置 Inter 字体，添加备用字体
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // 改善字体加载性能
  fallback: ['system-ui', 'Arial', 'sans-serif'] // 添加备用字体
})

export const metadata: Metadata = {
  title: '中医处方管理系统',
  description: '智能辅助诊疗与处方优化平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        {/* ASR 相关脚本 */}
        <Script src="/hmac-sha256.js" strategy="afterInteractive" />
        <Script src="/HmacSHA1.js" strategy="afterInteractive" />
        <Script src="/md5.js" strategy="afterInteractive" />
        <Script src="/enc-base64-min.js" strategy="afterInteractive" />
        <Script src="/index.umd.js" strategy="afterInteractive" />
        
        {children}
      </body>
    </html>
  )
}