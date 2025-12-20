import ReportForm from "@/components/reports/ReportForm";
import { reviewsApi } from "@/services/api/endpoints/reviews";
import type { ReplyResponseDto, ReviewResponseDto } from "@/services/api/types/swagger";
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
            <Ionicons name="person" size={14} color="#999" />
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
              <Ionicons name="create-outline" size={14} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.replyDeleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Ionicons name="trash-outline" size={14} color="#FF3B30" />
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
            placeholderTextColor="#999"
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
            <Ionicons name="arrow-undo-outline" size={14} color="#007AFF" />
            <Text style={styles.replyToReplyText}>Reply</Text>
          </TouchableOpacity>
        )}
        {!isOwner && currentUserId && !isEditing && (
          <TouchableOpacity
            style={styles.replyReportButton}
            onPress={() => setShowReportForm(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={12} color="#EF4444" />
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

  const isOwner = currentUserId === review.userId;

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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
              <Ionicons name="person" size={20} color="#999" />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
              {review.userName}
            </Text>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>
        {review.rating !== null && (
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= review.rating! ? "star" : "star-outline"}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        )}
      </View>

      <Text style={styles.comment} numberOfLines={10} ellipsizeMode="tail">
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
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <Ionicons
                  name={userLiked ? "thumbs-up" : "thumbs-up-outline"}
                  size={18}
                  color={userLiked ? "#007AFF" : "#666"}
                />
                <Text
                  style={[
                    styles.reactionCount,
                    userLiked && styles.reactionCountActive,
                  ]}
                >
                  {likesCount}
                </Text>
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
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <>
                <Ionicons
                  name={userDisliked ? "thumbs-down" : "thumbs-down-outline"}
                  size={18}
                  color={userDisliked ? "#FF3B30" : "#666"}
                />
                <Text
                  style={[
                    styles.reactionCount,
                    userDisliked && styles.reactionCountActive,
                  ]}
                >
                  {dislikesCount}
                </Text>
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
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Ionicons
                      name={showRepliesList ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#007AFF"
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
                <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
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
            <Ionicons name="flag-outline" size={16} color="#EF4444" />
            <Text style={styles.reportButtonText}>Report</Text>
          </TouchableOpacity>
        )}
        {isOwner && (
          <View style={styles.ownerActions} pointerEvents="box-none">
            {onUpdate && (
              <TouchableOpacity onPress={onUpdate} style={styles.editButton}>
                <Ionicons name="create-outline" size={18} color="#007AFF" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
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
                  <Ionicons name="arrow-undo" size={14} color="#666" />
                  <Text style={styles.replyingToText} numberOfLines={1} ellipsizeMode="tail">
                    Replying to {replyingToReply.userName}
                  </Text>
                </View>
              )}
              <TextInput
                style={styles.replyInput}
                placeholder={replyingToReplyId ? "Write a reply to this reply..." : "Write a reply..."}
                placeholderTextColor="#999"
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
              <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
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
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    overflow: "hidden",
    width: "100%",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
    flexShrink: 0,
  },
  comment: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    flexWrap: "wrap",
    gap: 8,
  },
  reactionButtons: {
    flexDirection: "row",
    gap: 16,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  reactionButtonActive: {
    backgroundColor: "#F0F8FF",
  },
  reactionCount: {
    fontSize: 14,
    color: "#666",
  },
  reactionCountActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  repliesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  repliesText: {
    fontSize: 14,
    color: "#007AFF",
  },
  replyToReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replyToReviewText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  reportButtonText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500",
  },
  ownerActions: {
    flexDirection: "row",
    gap: 12,
    flexShrink: 0,
    paddingLeft: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  repliesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  replyCard: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#E5E5E5",
    overflow: "hidden",
  },
  nestedReplyCard: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
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
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  replyToReplyText: {
    color: "#007AFF",
    fontSize: 13,
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
    paddingHorizontal: 8,
  },
  replyReportText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
  },
  replyingToContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#F0F8FF",
    borderRadius: 6,
  },
  replyingToText: {
    fontSize: 12,
    color: "#007AFF",
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
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  replyUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  replyDate: {
    fontSize: 12,
    color: "#999",
  },
  replyComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flexWrap: "wrap",
  },
  replyFormContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  replyInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    backgroundColor: "#FFF",
    color: "#333",
    marginBottom: 12,
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
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  replySubmitButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  replySubmitButtonDisabled: {
    backgroundColor: "#CCC",
  },
  replySubmitText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  addReplyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  addReplyText: {
    color: "#007AFF",
    fontSize: 14,
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
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    backgroundColor: "#FFF",
    color: "#333",
    marginBottom: 12,
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
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  replyEditSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  replyEditSaveButtonDisabled: {
    backgroundColor: "#CCC",
  },
  replyEditSaveText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
