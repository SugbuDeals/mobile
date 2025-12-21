import ReportForm from "@/components/reports/ReportForm";
import { reviewsApi } from "@/services/api/endpoints/reviews";
import type { ReplyResponseDto, ReviewResponseDto } from "@/services/api/types/swagger";
import { borderRadius, colors, spacing } from "@/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ReviewCardProps {
  review: ReviewResponseDto;
  currentUserId?: number;
  onUpdate?: () => void;
  onDelete?: () => void;
  showReplies?: boolean;
}

interface ReplyItemProps {
  reply: ReplyResponseDto;
  currentUserId?: number;
  reviewId: number;
  onReply: (replyId: number) => void;
  onUpdate?: () => void;
  depth: number;
}

// Recursive component for displaying nested replies
function ReplyItem({ reply, currentUserId, reviewId, onReply, onUpdate, depth }: ReplyItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply.comment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute to refresh relative time displays
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date(currentTime);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMs < 0) return "Just now"; // Handle future dates
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const maxDepth = 3; // Limit nesting depth to prevent UI issues
  const isNested = depth > 0;
  const canNest = depth < maxDepth;
  // Show reply button if user is authenticated and we haven't reached max depth
  const canReply = currentUserId && canNest;
  const isOwner = currentUserId === reply.userId;

  const handleEdit = () => {
    setEditText(reply.comment);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditText(reply.comment);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      Alert.alert("Error", "Please enter a reply");
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsApi.updateReply(reply.id, {
        comment: editText.trim(),
      });
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
      Alert.alert("Success", "Reply updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Reply",
      "Are you sure you want to delete this reply? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await reviewsApi.deleteReply(reply.id);
              if (onUpdate) {
                onUpdate();
              }
              Alert.alert("Success", "Reply deleted successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete reply");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.replyCard, isNested && styles.nestedReplyCard, { marginLeft: depth * 16 }]}>
      <View style={styles.replyHeader}>
        {reply.userImageUrl ? (
          <Image
            source={{ uri: reply.userImageUrl }}
            style={styles.replyAvatar}
          />
        ) : (
          <View style={styles.replyAvatarPlaceholder}>
            <Ionicons name="person" size={14} color={colors.gray400} />
          </View>
        )}
        <View style={styles.replyHeaderText}>
          <Text style={styles.replyUserName} numberOfLines={1} ellipsizeMode="tail">
            {reply.userName}
          </Text>
          <Text style={styles.replyDate}>{formatDate(reply.createdAt)}</Text>
        </View>
        {isOwner && !isEditing && (
          <View style={styles.replyOwnerActions} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.replyEditButton}
              onPress={handleEdit}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              <Ionicons name="create-outline" size={13} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.replyDeleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Ionicons name="trash-outline" size={13} color={colors.error} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {isEditing ? (
        <View style={styles.replyEditContainer}>
          <TextInput
            style={styles.replyEditInput}
            placeholder="Edit your reply..."
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={3}
            value={editText}
            onChangeText={setEditText}
            textAlignVertical="top"
          />
          <View style={styles.replyEditActions}>
            <TouchableOpacity
              style={styles.replyEditCancelButton}
              onPress={handleCancelEdit}
              disabled={isSubmitting}
            >
              <Text style={styles.replyEditCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.replyEditSaveButton, !editText.trim() && styles.replyEditSaveButtonDisabled]}
              onPress={handleSaveEdit}
              disabled={isSubmitting || !editText.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.replyEditSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.replyComment} numberOfLines={10} ellipsizeMode="tail">
          {reply.comment}
        </Text>
      )}
      
      <View style={styles.replyActionsRow}>
        {canReply && !isEditing && (
            <TouchableOpacity
              style={styles.replyToReplyButton}
              onPress={() => onReply(reply.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo-outline" size={12} color={colors.primary} />
              <Text style={styles.replyToReplyText}>Reply</Text>
            </TouchableOpacity>
        )}
        {!isOwner && currentUserId && !isEditing && (
          <TouchableOpacity
            style={styles.replyReportButton}
            onPress={() => setShowReportForm(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={11} color={colors.error} />
            <Text style={styles.replyReportText}>Report</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Report Form Modal for Reply */}
      <ReportForm
        visible={showReportForm}
        onClose={() => setShowReportForm(false)}
        onSuccess={() => setShowReportForm(false)}
        reportedUserId={reply.userId}
        reportedUserName={reply.userName}
      />

      {/* Render nested replies */}
      {reply.replies && reply.replies.length > 0 && (
        <View style={styles.nestedRepliesContainer}>
          {reply.replies.map((nestedReply) => (
            <ReplyItem
              key={nestedReply.id}
              reply={nestedReply}
              currentUserId={currentUserId}
              reviewId={reviewId}
              onReply={onReply}
              onUpdate={onUpdate}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ReviewCard({
  review,
  currentUserId,
  onUpdate,
  onDelete,
  showReplies = true,
}: ReviewCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [likesCount, setLikesCount] = useState(review.likesCount);
  const [dislikesCount, setDislikesCount] = useState(review.dislikesCount);
  const [userLiked, setUserLiked] = useState<boolean | null>(review.userLiked);
  const [userDisliked, setUserDisliked] = useState<boolean | null>(
    review.userDisliked
  );
  const [showRepliesList, setShowRepliesList] = useState(false);
  const [replies, setReplies] = useState<ReplyResponseDto[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyingToReplyId, setReplyingToReplyId] = useState<number | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const isOwner = currentUserId === review.userId;

  // Update current time every minute to refresh relative time displays
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Sync state with review prop changes (e.g., when user logs back in)
  useEffect(() => {
    setLikesCount(review.likesCount);
    setDislikesCount(review.dislikesCount);
    setUserLiked(review.userLiked);
    setUserDisliked(review.userDisliked);
  }, [review.likesCount, review.dislikesCount, review.userLiked, review.userDisliked]);

  const handleLike = async () => {
    if (isLiking || isDisliking) return;

    setIsLiking(true);
    try {
      const response = await reviewsApi.likeReview({ reviewId: review.id });

      // Update state based on response
      if (response.isLike === true) {
        // User liked
        if (userLiked) {
          // Already liked, removing like
          setLikesCount((prev) => prev - 1);
          setUserLiked(null);
        } else {
          // New like
          setLikesCount((prev) => prev + 1);
          setUserLiked(true);
          if (userDisliked) {
            setDislikesCount((prev) => prev - 1);
            setUserDisliked(false);
          }
        }
      } else if (response.isLike === false) {
        // User disliked (switched from like)
        setLikesCount((prev) => prev - 1);
        setUserLiked(false);
        setDislikesCount((prev) => prev + 1);
        setUserDisliked(true);
      } else {
        // No reaction
        if (userLiked) {
          setLikesCount((prev) => prev - 1);
        }
        setUserLiked(null);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to like review");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (isLiking || isDisliking) return;

    setIsDisliking(true);
    try {
      const response = await reviewsApi.dislikeReview({ reviewId: review.id });

      // Update state based on response
      if (response.isLike === false) {
        // User disliked
        if (userDisliked) {
          // Already disliked, removing dislike
          setDislikesCount((prev) => prev - 1);
          setUserDisliked(null);
        } else {
          // New dislike
          setDislikesCount((prev) => prev + 1);
          setUserDisliked(true);
          if (userLiked) {
            setLikesCount((prev) => prev - 1);
            setUserLiked(false);
          }
        }
      } else if (response.isLike === true) {
        // User liked (switched from dislike)
        setDislikesCount((prev) => prev - 1);
        setUserDisliked(false);
        setLikesCount((prev) => prev + 1);
        setUserLiked(true);
      } else {
        // No reaction
        if (userDisliked) {
          setDislikesCount((prev) => prev - 1);
        }
        setUserDisliked(null);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to dislike review");
    } finally {
      setIsDisliking(false);
    }
  };

  const handleLoadReplies = async () => {
    if (showRepliesList) {
      setShowRepliesList(false);
      setShowReplyForm(false);
      return;
    }

    setLoadingReplies(true);
    try {
      const repliesData = await reviewsApi.getReplies(review.id);
      setReplies(repliesData);
      setShowRepliesList(true);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load replies");
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleSubmitReply = async (parentReplyId?: number) => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Please enter a reply");
      return;
    }

    setSubmittingReply(true);
    try {
      await reviewsApi.createReply({
        reviewId: review.id,
        parentReplyId: parentReplyId,
        comment: replyText.trim(),
      });
      
      // Reload all replies to get the updated nested structure from the server
      const repliesData = await reviewsApi.getReplies(review.id);
      setReplies(repliesData);
      
      setReplyText("");
      setShowReplyForm(false);
      setReplyingToReplyId(null);
      Alert.alert("Success", "Reply posted successfully");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to post reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReplyToReply = (replyId: number) => {
    setReplyingToReplyId(replyId);
    setShowReplyForm(true);
  };

  // Helper function to find a reply by ID in nested structure
  const findReplyById = (replyList: ReplyResponseDto[], id: number): ReplyResponseDto | null => {
    for (const reply of replyList) {
      if (reply.id === id) {
        return reply;
      }
      if (reply.replies && reply.replies.length > 0) {
        const found = findReplyById(reply.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const replyingToReply = replyingToReplyId ? findReplyById(replies, replyingToReplyId) : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date(currentTime);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMs < 0) return "Just now"; // Handle future dates
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {review.userImageUrl ? (
            <Image
              source={{ uri: review.userImageUrl }}
              style={styles.avatar}
            />
          ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color={colors.gray400} />
          </View>
          )}
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {review.userName}
              </Text>
              {review.rating !== null && (
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= review.rating! ? "star" : "star-outline"}
                      size={12}
                      color={colors.secondaryDark}
                    />
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.comment} numberOfLines={6} ellipsizeMode="tail">
        {review.comment}
      </Text>

      <View style={styles.actions}>
        <View style={styles.reactionButtons}>
          <TouchableOpacity
            style={[styles.reactionButton, userLiked && styles.reactionButtonActive]}
            onPress={handleLike}
            disabled={isLiking || isDisliking}
          >
            {isLiking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={userLiked ? "thumbs-up" : "thumbs-up-outline"}
                  size={16}
                  color={userLiked ? colors.primary : colors.gray500}
                />
                {likesCount > 0 && (
                  <Text
                    style={[
                      styles.reactionCount,
                      userLiked && styles.reactionCountActive,
                    ]}
                  >
                    {likesCount}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reactionButton,
              userDisliked && styles.reactionButtonActive,
            ]}
            onPress={handleDislike}
            disabled={isLiking || isDisliking}
          >
            {isDisliking ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Ionicons
                  name={userDisliked ? "thumbs-down" : "thumbs-down-outline"}
                  size={16}
                  color={userDisliked ? colors.error : colors.gray500}
                />
                {dislikesCount > 0 && (
                  <Text
                    style={[
                      styles.reactionCount,
                      userDisliked && styles.reactionCountActive,
                    ]}
                  >
                    {dislikesCount}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>

        {showReplies && (
          <>
            {review.repliesCount > 0 && (
              <TouchableOpacity
                style={styles.repliesButton}
                onPress={handleLoadReplies}
                disabled={loadingReplies}
              >
            {loadingReplies ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={showRepliesList ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.repliesText}>
                  {review.repliesCount} {review.repliesCount === 1 ? "reply" : "replies"}
                </Text>
              </>
            )}
              </TouchableOpacity>
            )}
            {currentUserId && !showRepliesList && (
              <TouchableOpacity
                style={styles.replyToReviewButton}
                onPress={() => {
                  setShowRepliesList(true);
                  setShowReplyForm(true);
                  setReplyingToReplyId(null);
                }}
              >
                <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                <Text style={styles.replyToReviewText}>Reply</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {!isOwner && currentUserId && (
          <TouchableOpacity
            onPress={() => setShowReportForm(true)}
            style={styles.reportButton}
          >
            <Ionicons name="flag-outline" size={14} color={colors.error} />
            <Text style={styles.reportButtonText}>Report</Text>
          </TouchableOpacity>
        )}
        {isOwner && (
          <View style={styles.ownerActions} pointerEvents="box-none">
            {onUpdate && (
              <TouchableOpacity onPress={onUpdate} style={styles.editButton}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {showRepliesList && (
        <View style={styles.repliesContainer}>
          {replies.length > 0 && (
            <>
              {replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  currentUserId={currentUserId}
                  reviewId={review.id}
                  onReply={handleReplyToReply}
                  onUpdate={handleLoadReplies}
                  depth={0}
                />
              ))}
            </>
          )}

          {showReplyForm && (
            <View style={styles.replyFormContainer}>
              {replyingToReply && (
          <View style={styles.replyingToContainer}>
            <Ionicons name="arrow-undo" size={14} color={colors.gray600} />
            <Text style={styles.replyingToText} numberOfLines={1} ellipsizeMode="tail">
              Replying to {replyingToReply.userName}
            </Text>
          </View>
              )}
              <TextInput
                style={styles.replyInput}
                placeholder={replyingToReplyId ? "Write a reply to this reply..." : "Write a reply..."}
                placeholderTextColor={colors.gray400}
                multiline
                numberOfLines={3}
                value={replyText}
                onChangeText={setReplyText}
                textAlignVertical="top"
              />
              <View style={styles.replyFormActions}>
                <TouchableOpacity
                  style={styles.replyCancelButton}
                  onPress={() => {
                    setShowReplyForm(false);
                    setReplyText("");
                    setReplyingToReplyId(null);
                  }}
                >
                  <Text style={styles.replyCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.replySubmitButton, !replyText.trim() && styles.replySubmitButtonDisabled]}
                  onPress={() => handleSubmitReply(replyingToReplyId || undefined)}
                  disabled={submittingReply || !replyText.trim()}
                >
                  {submittingReply ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.replySubmitText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!showReplyForm && currentUserId && (
            <TouchableOpacity
              style={styles.addReplyButton}
              onPress={() => {
                setShowReplyForm(true);
                setReplyingToReplyId(null);
              }}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.addReplyText}>Add a reply</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Report Form Modal */}
      <ReportForm
        visible={showReportForm}
        onClose={() => setShowReportForm(false)}
        onSuccess={() => setShowReportForm(false)}
        reportedUserId={review.userId}
        reportedUserName={review.userName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: "hidden",
  },
  header: {
    marginBottom: spacing.sm,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray900,
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: colors.gray500,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 1,
    flexShrink: 0,
  },
  comment: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
    marginBottom: spacing.sm,
    flexWrap: "wrap",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  reactionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  reactionButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  reactionCount: {
    fontSize: 12,
    color: colors.gray600,
    fontWeight: "500",
  },
  reactionCountActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  repliesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  repliesText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  replyToReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  replyToReviewText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  reportButtonText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: "500",
  },
  ownerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    flexShrink: 0,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  repliesContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  replyCard: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
    overflow: "hidden",
  },
  nestedReplyCard: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  nestedRepliesContainer: {
    marginTop: 8,
  },
  replyHeaderText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginRight: 8,
  },
  replyToReplyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    alignSelf: "flex-start",
  },
  replyToReplyText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  replyActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  replyReportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  replyReportText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: "500",
  },
  replyingToContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
  },
  replyingToText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
    overflow: "hidden",
    width: "100%",
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  replyAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  replyUserName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.gray900,
    marginBottom: 2,
  },
  replyDate: {
    fontSize: 11,
    color: colors.gray500,
  },
  replyComment: {
    fontSize: 13,
    color: colors.gray700,
    lineHeight: 18,
    flexWrap: "wrap",
  },
  replyFormContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 13,
    minHeight: 60,
    backgroundColor: colors.white,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  replyFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  replyCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  replyCancelText: {
    color: colors.gray600,
    fontSize: 13,
    fontWeight: "600",
  },
  replySubmitButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  replySubmitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  replySubmitText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  addReplyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: "flex-start",
  },
  addReplyText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  replyOwnerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
    flexShrink: 0,
    paddingLeft: 8,
  },
  replyEditButton: {
    padding: 4,
  },
  replyDeleteButton: {
    padding: 4,
  },
  replyEditContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  replyEditInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 13,
    minHeight: 60,
    backgroundColor: colors.white,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  replyEditActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  replyEditCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  replyEditCancelText: {
    color: colors.gray600,
    fontSize: 13,
    fontWeight: "600",
  },
  replyEditSaveButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  replyEditSaveButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  replyEditSaveText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
