
export interface VoteResult {
  voted: boolean;
}

export interface SaveResult {
  saved: boolean;
  saves: number;
}

export interface FollowResult {
  success: boolean;
  follow?: any;
}

export interface FollowStatus {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

export interface SocialRepository {
  // Votes
  toggleVote(userId: string, targetType: string, targetId: string): Promise<VoteResult>;

  // Saves
  toggleSave(
    userId: string,
    targetType: string,
    targetId: string,
    metadata?: { collectionId?: string; cardId?: string; stackId?: string }
  ): Promise<SaveResult>;
  
  getUserSaves(userId: string, limit: number, offset: number): Promise<any[]>;

  // Follows
  toggleFollow(followerId: string, followingId: string): Promise<FollowResult>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowStatus(currentUserId: string | null, targetUserId: string): Promise<FollowStatus>;
  getFollowers(userId: string): Promise<any[]>;
  getFollowing(userId: string): Promise<any[]>;
}
