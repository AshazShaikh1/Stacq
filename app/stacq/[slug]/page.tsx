import { createClient } from '@/lib/supabase/server'
import { notFound, permanentRedirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ResourceCard } from '@/components/stacq/resource-card'
import { StacqBoard } from '@/components/stacq/stacq-board'
import { CollectionHeader } from '@/components/stacq/collection-header'
import { Suspense } from 'react'
import { StacqBoardSkeleton } from '@/components/stacq/stacq-board-skeleton'
import dynamic from 'next/dynamic'

const ShareButton = dynamic(() => import('@/components/stacq/share-button').then(mod => mod.ShareButton))
const SaveButton = dynamic(() => import('@/components/stacq/save-button').then(mod => mod.SaveButton))
const FollowButton = dynamic(() => import('@/components/profile/follow-button').then(mod => mod.FollowButton))
const AddResourceDialog = dynamic(() => import('@/components/stacq/add-resource-dialog').then(mod => mod.AddResourceDialog))



// ISR: Re-generate this page at most once every 60 seconds
export const revalidate = 60
import { Metadata, ResolvingMetadata } from 'next'


type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()

    const { data: stacq } = await supabase
        .from('stacqs')
        .select(`
            title, description,
            profiles(display_name, username)
        `)
        .eq('slug', slug)
        .single()

    if (!stacq) {
        return { title: 'Not Found | Stacq' }
    }

    const profile = Array.isArray(stacq.profiles) ? stacq.profiles[0] : stacq.profiles
    const creatorName = profile?.display_name || profile?.username || 'a Stacqer'
    
    const title = `${stacq.title} | Curated by ${creatorName} on Stacq`
    const description = (stacq.description && stacq.description.length > 0)
        ? stacq.description.substring(0, 160)
        : 'Explore this curated collection of high-signal resources on Stacq.'

    const ogUrl = new URL('https://stacq.in/api/og')
    ogUrl.searchParams.set('title', stacq.title)
    ogUrl.searchParams.set('username', profile?.username || 'stacqer')

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://stacq.in/stacq/${slug}`,
            images: [ogUrl.toString()],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogUrl.toString()],
        },
        alternates: {
            canonical: `https://stacq.in/stacq/${slug}`,
        }
    }
}


export default async function StacqDetailPage({ params }: Props) {
    const { slug } = await params;

    if (!slug || slug === 'undefined' || slug === 'null') {
        notFound()
    }

    const supabase = await createClient()

    // SEO REDIRECT: If the slug is a UUID, find the actual slug and redirect 301.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (isUuid) {
        const { data: stacq } = await supabase
            .from('stacqs')
            .select('slug')
            .eq('id', slug)
            .single()
        
        if (stacq?.slug) {
            permanentRedirect(`/stacq/${stacq.slug}`)
        }
    }


    const { data: { user: currentUser } } = await supabase.auth.getUser()

    const { data: stacq, error } = await supabase
        .from('stacqs')
        .select(`
            id, title, description, category, user_id, section_order,
            profiles(id, username, display_name, avatar_url),
            resources(id, title, url, thumbnail, note, section, order_index)
        `)
        .eq('slug', slug)
        .single()

    if (error) {
        return (
            <div className="p-6 sm:p-12 max-w-4xl mx-auto space-y-4 mt-12 bg-background rounded-2xl border-2 border-destructive/20 shadow-sm">
                <h1 className="text-xl sm:text-2xl font-bold text-destructive">Database Error</h1>
                <div className="p-4 bg-destructive/5 text-foreground font-mono text-xs sm:text-sm rounded-lg border border-destructive/10 space-y-2 overflow-x-auto">
                    <p><strong>Message:</strong> {error.message}</p>
                    <p><strong>Code:</strong> {error.code}</p>
                </div>
            </div>
        )
    }

    if (!stacq) notFound()

    const profile = Array.isArray(stacq.profiles) ? stacq.profiles[0] : stacq.profiles
    const isOwner = currentUser?.id === stacq.user_id

    const [followResult, saveResult] = await Promise.all([
        currentUser && !isOwner
            ? supabase.from('follows').select('id')
                .eq('follower_id', currentUser.id)
                .eq('following_id', stacq.user_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        currentUser && !isOwner
            ? supabase.from('saved_collections').select('id')
                .eq('user_id', currentUser.id)
                .eq('stacq_id', stacq.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
    ])

    const isFollowingCreator = !!followResult.data
    const isSaved = !!saveResult.data

    const derivedSections = new Set<string>(stacq.section_order || [])
    if (stacq.resources) {
        stacq.resources.forEach((r: any) => {
            if (r.section) derivedSections.add(r.section)
        })
    }
    
    // Only provide "Default" as a starting point if no sections are defined yet
    if (derivedSections.size === 0) {
        derivedSections.add('Default')
    }
    
    const sections = Array.from(derivedSections)

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: stacq.title,
        description: stacq.description,
        url: `https://stacq.in/stacq/${slug}`,
        author: {
            '@type': 'Person',
            name: profile?.display_name || profile?.username,
            url: `https://stacq.in/${profile?.username}`
        },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: stacq.resources?.length || 0,
            itemListElement: stacq.resources?.map((resource: any, index: number) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'WebPage',
                    name: resource.title,
                    url: resource.url,
                    description: resource.note,
                    image: resource.thumbnail
                }
            }))
        }
    }


    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-32 md:pb-20 space-y-6 sm:space-y-8 min-h-dvh overflow-x-hidden w-full">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <CollectionHeader stacq={stacq} isOwner={isOwner} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-5 border-y border-border gap-6 sm:gap-4">
                <Link href={`/${profile?.username}`} className="flex items-center gap-3 sm:gap-4 group cursor-pointer w-full sm:w-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold border-2 border-background shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                        {profile?.avatar_url ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile.username || 'avatar'}
                                    fill
                                    sizes="(max-width: 640px) 40px, 48px"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        ) : (
                            profile?.username?.substring(0, 1).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-tight">@{profile?.username}</p>
                        <p className="text-[9px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Stacqer</p>
                    </div>
                </Link>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Suspense fallback={<div className="h-10 w-32 bg-muted animate-pulse rounded-full" />}>
                        <StacqActions 
                            stacq={stacq} 
                            isOwner={isOwner} 
                            currentUser={currentUser} 
                            slug={slug} 
                            sections={sections}
                        />
                    </Suspense>
                </div>
            </div>

            <Suspense fallback={<StacqBoardSkeleton />}>
                <div className="pt-2">
                    <StacqBoard initialStacq={stacq} isOwner={isOwner} />
                </div>
            </Suspense>
        </div>
    )
}

async function StacqActions({ stacq, isOwner, currentUser, slug, sections }: any) {
    const supabase = await createClient()

    const [followResult, saveResult] = await Promise.all([
        currentUser && !isOwner
            ? supabase.from('follows').select('id')
                .eq('follower_id', currentUser.id)
                .eq('following_id', stacq.user_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        currentUser && !isOwner
            ? supabase.from('saved_collections').select('id')
                .eq('user_id', currentUser.id)
                .eq('stacq_id', stacq.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
    ])

    const isFollowingCreator = !!followResult.data
    const isSaved = !!saveResult.data

    return (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-fit">
                <ShareButton title={stacq.title} stacqId={slug} />
                {!isOwner && (
                    <SaveButton stacqId={stacq.id} isInitiallySaved={isSaved} />
                )}
            </div>

            {!isOwner && stacq.profiles?.id && (
                <div className="flex-1 sm:flex-none min-w-[120px]">
                    <FollowButton targetUserId={stacq.profiles.id} isInitiallyFollowing={isFollowingCreator} />
                </div>
            )}

            {isOwner && (
                <AddResourceDialog stacqId={stacq.id} availableSections={sections} />
            )}
        </div>
    )
}