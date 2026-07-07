import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이지모드 - 우리 가족 택시 도우미",
  description: "어르신을 위한 쉬운 택시 호출 서비스",
  manifest: "/manifest.json",
};

// 어르신이 손가락으로 화면을 확대할 수 있어야 하므로 확대를 막지 않는다
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF6B00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col max-w-[500px] mx-auto">
        {children}
      </body>
    </html>
  );
}
