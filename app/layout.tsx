import React, { ReactNode } from 'react';
import './ui/global.css';
import { roboto } from './ui/fonts';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`font-[var(${roboto})] text-lg`}>
        {children}
      </body>
    </html>
  )
}

