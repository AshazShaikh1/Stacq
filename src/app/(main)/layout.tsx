import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { DiscussionProvider } from "@/contexts/DiscussionContext";
import { DiscussionDrawer } from "@/components/discussion/DiscussionDrawer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DiscussionProvider>
      <div className="min-h-screen bg-cloud">
        
        {/* --- MOBILE ELEMENTS --- */}
        <MobileHeader />
        <MobileNav />

        {/* --- DESKTOP SIDEBAR --- */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* --- MAIN CONTENT WRAPPER --- */}
        <div className="min-h-screen transition-all duration-200 pt-16 pb-20 md:pt-0 md:pb-0 md:pl-16">
          
          {/* DESKTOP HEADER */}
          <div className="hidden md:block sticky top-0 z-40">
            <Header />
          </div>

          <main className="h-full">
            {children}
          </main>
        </div>

        <DiscussionDrawer />
      </div>
    </DiscussionProvider>
  );
}
