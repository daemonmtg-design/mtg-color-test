import './globals.css';
import Header from '@/components/Header';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MTG Color Quiz',
    template: '%s | MTG Color Quiz'
  },
  description: 'A free, unofficial fan project.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MTG Color Quiz',
    description: 'A free, unofficial fan project.',
    url: siteUrl,
    siteName: 'MTG Color Quiz',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MTG Color Quiz',
    description: 'A free, unofficial fan project.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}
