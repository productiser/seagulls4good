import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brighton Seagulls for Good',
  description: "Brighton's seagulls don't want your chips anymore. They want your support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Anton&family=Caveat:wght@600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
