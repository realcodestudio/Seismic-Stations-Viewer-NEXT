import type { Metadata } from 'next';
import { Noto_Sans_SC } from 'next/font/google';
import './globals.css';

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-noto-sc',
});

export const metadata: Metadata = {
  title: 'SSV NEXT',
  description: 'Real-time seismic station data viewer powered by Wolfx SeisJS API',
  icons: { icon: '/wolf.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={notoSansSC.variable}>
      <body>{children}</body>
    </html>
  );
}
