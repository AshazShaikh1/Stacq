import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileHeader } from '@/components/layout/MobileHeader';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cloud">
      
      {/* --- MOBILE ELEMENTS --- */}
      <MobileHeader />
      <MobileNav />

      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* --- MAIN CONTENT WRAPPER --- */}
      {/* md:pl-16 -> Pushes content 4rem (64px) to right to match Sidebar width 
          pt-16 pb-20 -> Mobile padding for Top/Bottom bars
          md:pt-0 md:pb-0 -> Reset mobile padding on desktop
      */}
      <div className="min-h-screen transition-all duration-200 pt-16 pb-20 md:pt-0 md:pb-0 md:pl-16">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:block sticky top-0 z-40">
          <Header />
        </div>

        <main className="h-full">
          {children}
        </main>
      </div>

    </div>
  );
}
