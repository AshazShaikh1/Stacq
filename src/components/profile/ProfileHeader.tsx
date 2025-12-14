"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useFollow } from "@/hooks/useFollow";
import { ProfilePictureEditor } from "./ProfilePictureEditor";
import { EditProfileModal } from "./EditProfileModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FollowListModal } from "./FollowListModal";
import { useToast } from "@/contexts/ToastContext";

interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    role?: string;
    stats?: {
      collections_created: number;
      collections_saved: number;
      total_upvotes: number;
      total_views: number;
      followers?: number;
      following?: number;
    };
  };
  isOwnProfile?: boolean;
}

export function ProfileHeader({
  profile,
  isOwnProfile = false,
}: ProfileHeaderProps) {
  const { showSuccess, showError } = useToast();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [followListType, setFollowListType] = useState<
    "followers" | "following" | null
  >(null);

  const stats = profile.stats || {
    collections_created: 0,
    collections_saved: 0,
    total_upvotes: 0,
    total_views: 0,
    followers: 0,
    following: 0,
  };

  const {
    isFollowing,
    followerCount,
    followingCount,
    isLoading: isFollowLoading,
    error: followError,
    toggleFollow,
  } = useFollow({
    userId: profile.id,
    initialIsFollowing: false,
    initialFollowerCount: stats.followers || 0,
    initialFollowingCount: stats.following || 0,
  });

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    showSuccess("Logged out successfully");
    window.location.href = "/";
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile.username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.display_name} (@${profile.username})`,
          text: `Check out ${profile.display_name}'s profile on Stacq`,
          url: profileUrl,
        });
      } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        showSuccess("Link copied to clipboard!");
      } catch (err) {
        showError("Failed to copy link");
      }
    }
  };

  return (
    <div className="mb-6 md:mb-8">
      {/* 1. Header Section: Avatar & Info */}
      {/* Mobile: Flex Column (Center) | Desktop: Flex Row (Left) */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {isOwnProfile ? (
            <ProfilePictureEditor
              currentAvatarUrl={avatarUrl}
              displayName={profile.display_name}
              userId={profile.id}
              onUpdate={(newUrl) => setAvatarUrl(newUrl || undefined)}
            />
          ) : avatarUrl ? (
            <div className="w-24 h-24 md:w-32 md:h-32 relative rounded-full border-4 border-white shadow-card overflow-hidden">
              <Image
                src={avatarUrl}
                alt={profile.display_name}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-jet/20 to-gray-light border-4 border-white shadow-card flex items-center justify-center text-3xl md:text-4xl font-bold text-jet">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
          <h1 className="text-2xl md:text-4xl font-bold text-jet-dark mb-1">
            {displayName}
          </h1>
          <p className="text-sm md:text-base text-gray-muted mb-4 md:mb-6">
            @{profile.username}
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 w-full">
            {isOwnProfile ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareProfile}
                  className="flex-1 md:flex-none"
                >
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 md:flex-none"
                >
                  Edit
                </Button>

                {(profile.role === "stacker" || profile.role === "admin") && (
                  <Link href="/stacker/dashboard" className="hidden md:block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald hover:text-emerald-dark hover:border-emerald"
                    >
                      Dashboard
                    </Button>
                  </Link>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:border-red-600 hidden md:block"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={isFollowing ? "outline" : "primary"}
                  size="sm"
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                  className="w-32"
                >
                  {isFollowLoading
                    ? "..."
                    : isFollowing
                    ? "Unfollow"
                    : "Follow"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareProfile}
                >
                  Share
                </Button>
              </>
            )}
          </div>
          {followError && (
            <p className="text-sm text-red-500 mt-2">{followError}</p>
          )}
        </div>
      </div>

      {/* 2. Stats Section: Horizontal Scroll on Mobile */}
      <div className="border-t border-b border-gray-light md:border-none py-4 md:py-0">
        <div className="flex md:gap-8 justify-around md:justify-start overflow-x-auto no-scrollbar items-center">
          <div className="flex flex-col items-center md:items-start min-w-[70px]">
            <div className="text-lg md:text-2xl font-bold text-jet-dark">
              {stats.collections_created}
            </div>
            <div className="text-[10px] md:text-sm text-gray-muted uppercase tracking-wide md:normal-case">
              Stacks
            </div>
          </div>

          <button
            onClick={() => setFollowListType("followers")}
            className="flex flex-col items-center md:items-start min-w-[70px] hover:opacity-70"
          >
            <div className="text-lg md:text-2xl font-bold text-jet-dark">
              {followerCount}
            </div>
            <div className="text-[10px] md:text-sm text-gray-muted uppercase tracking-wide md:normal-case">
              Followers
            </div>
          </button>

          <button
            onClick={() => setFollowListType("following")}
            className="flex flex-col items-center md:items-start min-w-[70px] hover:opacity-70"
          >
            <div className="text-lg md:text-2xl font-bold text-jet-dark">
              {followingCount}
            </div>
            <div className="text-[10px] md:text-sm text-gray-muted uppercase tracking-wide md:normal-case">
              Following
            </div>
          </button>

          <div className="flex flex-col items-center md:items-start min-w-[70px]">
            <div className="text-lg md:text-2xl font-bold text-jet-dark">
              {stats.total_upvotes}
            </div>
            <div className="text-[10px] md:text-sm text-gray-muted uppercase tracking-wide md:normal-case">
              Upvotes
            </div>
          </div>

          <div className="hidden xs:flex flex-col items-center md:items-start min-w-[70px]">
            <div className="text-lg md:text-2xl font-bold text-jet-dark">
              {stats.total_views}
            </div>
            <div className="text-[10px] md:text-sm text-gray-muted uppercase tracking-wide md:normal-case">
              Views
            </div>
          </div>
        </div>
      </div>

      {followListType && (
        <FollowListModal
          isOpen={!!followListType}
          onClose={() => setFollowListType(null)}
          userId={profile.id}
          type={followListType}
        />
      )}

      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentDisplayName={displayName}
          currentUsername={profile.username}
          userId={profile.id}
          onUpdate={setDisplayName}
        />
      )}

      {isOwnProfile && (
        <ConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleSignOut}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmText="Sign out"
          cancelText="Cancel"
          variant="default"
        />
      )}
    </div>
  );
}
