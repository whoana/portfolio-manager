import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/app/components/ClientProviders";

export const metadata: Metadata = {
  title: "ETF 포트폴리오 매니저",
  description: "ETF 포트폴리오를 쉽게 구성하고 관리하세요",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="claude" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('etf_theme');if(t==='claude'||t==='dark'||t==='classic')document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
