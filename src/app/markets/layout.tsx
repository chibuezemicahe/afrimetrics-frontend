import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Market Overview | Afrimetrics',
  description: 'Track and analyze African stock markets in real-time with visual analytics and performance data.',
};

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}