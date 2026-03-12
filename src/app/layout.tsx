import type { Metadata, Viewport } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

// 引入优雅的无衬线英文字体
const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// 引入极简的代码体
const geistMono = Geist_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "展览影像归档站 | Exhibition Archive",
  description: "使用 Next.js、Tailwind CSS 构建的现代化展览照片上传与归档网站。",
};

// 配置视口和基础的主题色 (帮助浏览器更好地适配亮暗模式状态栏)
export const viewport: Viewport = {
  themeColor:[
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning 是实现亮暗色无缝切换的最佳实践，防止 Next.js 报错
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${geistMono.variable} antialiased selection:bg-primary/20 selection:text-primary`}>
        {children}
      </body>
    </html>
  );
}