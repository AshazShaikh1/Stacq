import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FeedGrid } from '@/components/feed/FeedGrid';
import { createClient } from '@/lib/supabase/server';
import { LandingPageButtons, LandingPageCTAButtons, LandingPageButtonsProvider } from './LandingPageButtons';

export async function LandingPage() {
  const supabase = await createClient();
  
  // Get some featured collections for the landing page
  const { data: collections } = await supabase
    .from('collections')
    .select(`
      id,
      title,
      description,
      cover_image_url,
      owner_id,
      stats,
      owner:users!collections_owner_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .eq('is_hidden', false)
    .order('stats->upvotes', { ascending: false })
    .limit(12);

  return (
    <LandingPageButtonsProvider>
      <div className="min-h-screen bg-cloud">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-jet/5 to-cloud py-20">
          <div className="container mx-auto px-page">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-jet-dark mb-6">
                What is <span className="text-jet">Stacq</span>?
              </h1>
              <p className="text-xl text-gray-muted mb-4 leading-relaxed">
                Stacq is a platform where you can discover, organize, and share curated resources. 
                Create <strong>Collections</strong> and add <strong>Cards</strong> (resources) 
                to build your knowledge base and share it with the community.
              </p>
              <p className="text-lg text-gray-muted mb-8">
                Think of it as Pinterest for resources, GitHub for knowledge, and Reddit for discovery—all in one.
              </p>
              <LandingPageButtons />
            </div>
          </div>
        </div>

      {/* Features Section */}
      <div className="container mx-auto px-page py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-h1 font-bold text-jet-dark mb-12 text-center">
            How it works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-jet text-white rounded-lg flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-h2 font-semibold text-jet-dark mb-3">Create Collections</h3>
              <p className="text-body text-gray-muted">
                Organize your resources into themed collections. Each collection can have a title, description, and cover image.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-jet text-white rounded-lg flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-h2 font-semibold text-jet-dark mb-3">Add Cards</h3>
              <p className="text-body text-gray-muted">
                Add resources as cards to your collections. Cards automatically fetch metadata like title, description, and thumbnail.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-jet text-white rounded-lg flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-h2 font-semibold text-jet-dark mb-3">Share & Discover</h3>
              <p className="text-body text-gray-muted">
                Share your collections with the community, discover new resources, upvote favorites, and follow other creators.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Collections */}
      {collections && collections.length > 0 && (
        <div className="container mx-auto px-page py-16 bg-white">
          <div className="mb-8 text-center">
            <h2 className="text-h1 font-bold text-jet-dark mb-2">Trending Collections</h2>
            <p className="text-body text-gray-muted">
              Discover what the community is loving right now
            </p>
          </div>
          <FeedGrid collections={collections} />
          <div className="text-center mt-8">
            <Link href="/explore">
              <Button variant="outline" size="lg">
                Explore all collections
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-jet text-white py-20">
        <div className="container mx-auto px-page text-center">
          <h2 className="text-h1 font-bold mb-4">Ready to start collecting?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users creating and sharing amazing resource collections. 
            Start building your knowledge base today.
          </p>
          <LandingPageCTAButtons />
        </div>
      </div>
      </div>
    </LandingPageButtonsProvider>
  );
}
