import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingPageButtonsProvider } from '@/components/landing/LandingPageButtons';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LandingPageButtonsProvider>
      <div className="min-h-screen bg-cloud">
        <LandingHeader />
        <main>{children}</main>
      </div>
    </LandingPageButtonsProvider>
  );
}
