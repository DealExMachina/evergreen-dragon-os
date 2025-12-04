import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Evergreen Dragon OS',
  description: 'AI-Native Operating System for Evergreen & ELTIF 2.0 Fund Management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CopilotKit runtimeUrl="/api/copilotkit">
          <CopilotSidebar>
            {children}
          </CopilotSidebar>
        </CopilotKit>
      </body>
    </html>
  );
}

