import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "إسناد | إدارة المعلمات والتكليفات والنصاب",
  description:
    "إسناد - نظام إدارة المعلمات والتكليفات والنصاب التدريسي في المدارس",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-tajawal">{children}</body>
    </html>
  );
}
