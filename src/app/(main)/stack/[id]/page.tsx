import { redirect } from 'next/navigation';

interface StackPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Legacy route: /stack/[id] redirects to /collection/[id]
 * This maintains backward compatibility for old links
 */
export default async function StackPage({ params }: StackPageProps) {
  const { id } = await params;
  // Redirect to the new collection route
  redirect(`/collection/${id}`);
}