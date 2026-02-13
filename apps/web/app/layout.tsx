import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Secure Transactions Mini-App',
  description: 'Mirfa internship challenge app'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
