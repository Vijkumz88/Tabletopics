import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AppProvider } from '@/lib/context/AppContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ImpromptuSpeechNinja',
  description: 'Improve your impromptu speaking skills with AI-powered feedback',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
} 