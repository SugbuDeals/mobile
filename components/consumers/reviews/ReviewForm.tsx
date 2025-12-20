import { reviewsApi } from "@/services/api/endpoints/reviews";
import type { CreateReviewDto } from "@/services/api/types/swagger";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ReviewFormProps {
  storeId: number;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingReview?: {
    id: number;
    rating: number | null;
    comment: string;
  } | null;
}

export default function ReviewForm({
  storeId,
  visible,
  onClose,
  onSuccess,
  existingReview,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number | null>(
    existingReview?.rating ?? null
  );
  
  // Ensure rating is set when editing existing review
  useEffect(() => {
    if (existingReview?.rating && !rating) {
      setRating(existingReview.rating);
    }
  }, [existingReview]);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingReview) {
        // Update existing review
        await reviewsApi.updateReview(existingReview.id, {
          rating: rating,
          comment: comment.trim(),
        });
        Alert.alert("Success", "Review updated successfully");
      } else {
        // Create new review
        const data: CreateReviewDto = {
          storeId,
          rating: rating,
          comment: comment.trim(),
        };
        await reviewsApi.createReview(data);
        Alert.alert("Success", "Review submitted successfully");
      }
      onSuccess();
      handleClose();
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to submit review. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!existingReview) {
      setRating(null);
      setComment("");
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {existingReview ? "Edit Review" : "Write a Review"}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.label}>Rating *</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={rating && star <= rating ? "star" : "star-outline"}
                    size={32}
                    color={rating && star <= rating ? "#FFD700" : "#DDD"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.commentSection}>
            <Text style={styles.label}>Comment *</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting || !comment.trim() || !rating}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {existingReview ? "Update" : "Submit"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  ratingSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  commentSection: {
    marginBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    color: "#333",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#007AFF",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
