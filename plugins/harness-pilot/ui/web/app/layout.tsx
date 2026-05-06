import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Harness Pilot 控制台",
  description: "Harness Pilot 任务管理控制台",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
