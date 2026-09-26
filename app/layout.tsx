import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });
export const metadata: Metadata = {
  title: 'Уфанет — интернет, который летит к вам',
  description: 'Быстрый домашний интернет Уфанет до 1 Гбит/с. Проверьте подключение по вашему адресу.',
  openGraph: { title: 'Уфанет — интернет, который летит к вам', description: 'Стабильный домашний интернет до 1 Гбит/с.', images: ['/og.png'] },
  twitter: { card: 'summary_large_image', title: 'Уфанет — интернет, который летит к вам', description: 'Стабильный домашний интернет до 1 Гбит/с.', images: ['/og.png'] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ru"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>; }
