import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-page py-section">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-h1 font-bold text-jet-dark mb-4">
            Discover and share curated resources
          </h1>
          <p className="text-body text-gray-muted mb-8 max-w-2xl mx-auto">
            Stack is a human-curated resource platform where people create boards
            and add resources. Discover high-quality content curated by the community.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button variant="primary" size="lg">
                Get started
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="secondary" size="lg">
                Explore
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

