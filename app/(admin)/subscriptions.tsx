import { useLogin } from "@/features/auth";
import { useStore } from "@/features/store";
import type { Subscription } from "@/types/prisma";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function AdminSubscriptions() {
  const { state: { allUsers } } = useLogin();
  const {
    action: {
      findSubscriptions,
      createSubscription,
      updateSubscription,
      deleteSubscription,
      getSubscriptionAnalytics,
    },
    state: { subscriptions, subscriptionAnalytics, loading },
  } = useStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Form state for managing subscription plans (admin)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    plan: "FREE" as "FREE" | "BASIC" | "PREMIUM",
    billingCycle: "MONTHLY" as "MONTHLY" | "YEARLY",
    price: "",
    benefits: "",
    isActive: true,
    startsAt: "",
    endsAt: "",
  });

  // Fetch subscriptions and analytics on mount
  useFocusEffect(
    useCallback(() => {
      findSubscriptions();
      getSubscriptionAnalytics();
    }, [findSubscriptions, getSubscriptionAnalytics])
  );

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter a subscription name.");
      return;
    }

    try {
      setIsProcessing(true);
      await createSubscription({
        name: formData.name.trim(),
        plan: formData.plan,
        price: formData.price ? formData.price : "0",
        isActive: formData.isActive,
      }).unwrap();

      setShowCreateModal(false);
      resetForm();
      findSubscriptions();
      getSubscriptionAnalytics();
      Alert.alert("Success", "Subscription created successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create subscription.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSubscription) return;

    try {
      setIsProcessing(true);
      await updateSubscription({
        id: selectedSubscription.id,
        name: formData.name.trim() || undefined,
        plan: formData.plan,
        price: formData.price ? formData.price : "0",
        isActive: formData.isActive,
      }).unwrap();

      setShowEditModal(false);
      setSelectedSubscription(null);
      resetForm();
      findSubscriptions();
      getSubscriptionAnalytics();
      Alert.alert("Success", "Subscription updated successfully!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update subscription.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Subscription",
      "Are you sure you want to delete this subscription?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              await deleteSubscription(id).unwrap();
              findSubscriptions();
              getSubscriptionAnalytics();
              Alert.alert("Success", "Subscription deleted successfully!");
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : "Failed to delete subscription.";
              Alert.alert("Error", errorMessage);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      name: subscription.name || "",
      description: subscription.description || "",
      plan: subscription.plan || "FREE",
      billingCycle: subscription.billingCycle || "MONTHLY",
      price: typeof subscription.price === 'string' ? subscription.price : String(subscription.price || ""),
      benefits: subscription.benefits || "",
      isActive: typeof subscription.isActive === "boolean" ? subscription.isActive : true,
      startsAt: subscription.startsAt ? new Date(subscription.startsAt).toISOString().split("T")[0] : "",
      endsAt: subscription.endsAt ? new Date(subscription.endsAt).toISOString().split("T")[0] : "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      plan: "FREE",
      billingCycle: "MONTHLY",
      price: "",
      benefits: "",
      isActive: true,
      startsAt: "",
      endsAt: "",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleStartDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split("T")[0];
      setFormData((prev) => {
        const updated = { ...prev, startsAt: isoDate };
        if (prev.endsAt) {
          const prevEnd = new Date(prev.endsAt);
          if (selectedDate > prevEnd) {
            updated.endsAt = isoDate;
          }
        }
        return updated;
      });
    }
  };

  const handleEndDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        endsAt: selectedDate.toISOString().split("T")[0],
      }));
    }
  };

  const getDateValue = (value: string) => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "#10B981" : "#6B7280";
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "PREMIUM":
        return "#FFBE5D";
      case "BASIC":
        return "#277874";
      case "FREE":
      default:
        return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAnalytics(!showAnalytics)}
          >
            <Ionicons name="stats-chart" size={20} color="#277874" />
            <Text style={styles.actionButtonText}>
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.addButtonAction]}
            onPress={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={[styles.actionButtonText, styles.addButtonText]}>Create Subscription</Text>
          </TouchableOpacity>
        </View>
        {/* Analytics Section */}
        {showAnalytics && subscriptionAnalytics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analytics</Text>
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Total</Text>
                  <Text style={styles.analyticsValue}>{subscriptionAnalytics.total}</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Active</Text>
                  <Text style={[styles.analyticsValue, { color: "#10B981" }]}>
                    {subscriptionAnalytics.active}
                  </Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Revenue</Text>
                  <Text style={[styles.analyticsValue, { color: "#FFBE5D" }]}>
                    ${subscriptionAnalytics.totalRevenue}
                  </Text>
                </View>
              </View>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>This Month</Text>
                  <Text style={styles.analyticsValue}>
                    {subscriptionAnalytics.subscriptionsThisMonth}
                  </Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Recent (30d)</Text>
                  <Text style={styles.analyticsValue}>
                    {subscriptionAnalytics.recentSubscriptions}
                  </Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Avg Price</Text>
                  <Text style={styles.analyticsValue}>
                    ${subscriptionAnalytics.averagePrice}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Subscription Plans List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Subscription Plans ({subscriptions.length})
          </Text>

          {loading && subscriptions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading subscriptions...</Text>
            </View>
          ) : subscriptions.length > 0 ? (
            subscriptions.map((subscription) => (
              <View key={subscription.id} style={styles.subscriptionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.planBadge,
                        { backgroundColor: getPlanColor(subscription.plan || "FREE") },
                      ]}
                    >
                      <Text style={styles.planBadgeText}>
                        {subscription.plan || "FREE"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(subscription.isActive !== false) },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {subscription.isActive !== false ? "ACTIVE" : "INACTIVE"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(subscription)}
                      disabled={isProcessing}
                    >
                      <Ionicons name="create-outline" size={18} color="#277874" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(subscription.id)}
                      disabled={isProcessing}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.userName}>
                    {subscription.name || "Untitled Plan"}
                  </Text>
                  {subscription.description ? (
                    <Text style={styles.planDescription}>
                      {subscription.description}
                    </Text>
                  ) : null}
                  <View style={styles.detailsRow}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {subscription.price ? `₱${subscription.price}` : "Free"}
                    </Text>
                    <Text style={styles.detailText}> • </Text>
                    <Text style={styles.detailText}>
                      {subscription.billingCycle || "MONTHLY"}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {formatDate(subscription.startsAt || "")} -{" "}
                      {formatDate(subscription.endsAt || "")}
                    </Text>
                  </View>
                  {subscription.benefits ? (
                    <View style={styles.detailsRow}>
                      <Ionicons name="list-circle-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {subscription.benefits}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No subscriptions found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Subscription Plan</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g. Premium Retailer"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Short description of the subscription plan"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Plan</Text>
                <View style={styles.radioGroup}>
                  {(["FREE", "BASIC", "PREMIUM"] as const).map((plan) => (
                    <TouchableOpacity
                      key={plan}
                      style={[
                        styles.radioOption,
                        formData.plan === plan && styles.radioOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, plan })}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          formData.plan === plan && styles.radioTextSelected,
                        ]}
                      >
                        {plan}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Billing Cycle</Text>
                <View style={styles.radioGroup}>
                  {(["MONTHLY", "YEARLY"] as const).map((cycle) => (
                    <TouchableOpacity
                      key={cycle}
                      style={[
                        styles.radioOption,
                        formData.billingCycle === cycle && styles.radioOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, billingCycle: cycle })}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          formData.billingCycle === cycle && styles.radioTextSelected,
                        ]}
                      >
                        {cycle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Benefits</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.benefits}
                  onChangeText={(text) => setFormData({ ...formData, benefits: text })}
                  placeholder={"• Unlimited listings\n• Featured placement\n• Priority support"}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Availability</Text>
                <View style={styles.radioGroup}>
                  {[
                    { label: "Active", value: true },
                    { label: "Inactive", value: false },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.radioOption,
                        formData.isActive === option.value && styles.radioOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, isActive: option.value })}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          formData.isActive === option.value && styles.radioTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.dateIcon}
                  />
                  <Text
                    style={[
                      styles.dateTextInput,
                      !formData.startsAt && styles.datePlaceholder,
                    ]}
                  >
                    {formData.startsAt ? formatDate(formData.startsAt) : "Select start date"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.dateIcon}
                  />
                  <Text
                    style={[
                      styles.dateTextInput,
                      !formData.endsAt && styles.datePlaceholder,
                    ]}
                  >
                    {formData.endsAt ? formatDate(formData.endsAt) : "Select end date"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isProcessing && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={isProcessing}
              >
                <Text style={styles.saveButtonText}>
                  {isProcessing ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Subscription Plan</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g. Premium Retailer"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Short description of the subscription plan"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Plan</Text>
                <View style={styles.radioGroup}>
                  {(["FREE", "BASIC", "PREMIUM"] as const).map((plan) => (
                    <TouchableOpacity
                      key={plan}
                      style={[
                        styles.radioOption,
                        formData.plan === plan && styles.radioOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, plan })}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          formData.plan === plan && styles.radioTextSelected,
                        ]}
                      >
                        {plan}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Billing Cycle</Text>
                <View style={styles.radioGroup}>
                  {(["MONTHLY", "YEARLY"] as const).map((cycle) => (
                    <TouchableOpacity
                      key={cycle}
                      style={[
                        styles.radioOption,
                        formData.billingCycle === cycle && styles.radioOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, billingCycle: cycle })}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          formData.billingCycle === cycle && styles.radioTextSelected,
                        ]}
                      >
                        {cycle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Benefits</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.benefits}
                  onChangeText={(text) => setFormData({ ...formData, benefits: text })}
                  placeholder={"• Unlimited listings\n• Featured placement\n• Priority support"}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Availability</Text>
                <View style={styles.radioGroup}>
                  {[
                    { label: "Active", value: true },
                    { label: "Inactive", value: false },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.radioOption,
                        formData.isActive === option.value && styles.radioOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, isActive: option.value })}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          formData.isActive === option.value && styles.radioTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.dateIcon}
                  />
                  <Text
                    style={[
                      styles.dateTextInput,
                      !formData.startsAt && styles.datePlaceholder,
                    ]}
                  >
                    {formData.startsAt ? formatDate(formData.startsAt) : "Select start date"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.dateIcon}
                  />
                  <Text
                    style={[
                      styles.dateTextInput,
                      !formData.endsAt && styles.datePlaceholder,
                    ]}
                  >
                    {formData.endsAt ? formatDate(formData.endsAt) : "Select end date"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isProcessing && styles.buttonDisabled]}
                onPress={handleUpdate}
                disabled={isProcessing}
              >
                <Text style={styles.saveButtonText}>
                  {isProcessing ? "Updating..." : "Update"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showStartDatePicker && (
        <DateTimePicker
          value={getDateValue(formData.startsAt)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={getDateValue(formData.endsAt || formData.startsAt)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={formData.startsAt ? getDateValue(formData.startsAt) : undefined}
          onChange={handleEndDateChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#277874",
  },
  addButtonAction: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  addButtonText: {
    color: "#ffffff",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 16,
  },
  analyticsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  analyticsItem: {
    alignItems: "center",
  },
  analyticsLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  subscriptionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    gap: 8,
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  planDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#374151",
  },
  multilineInput: {
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  radioOptionSelected: {
    backgroundColor: "#277874",
    borderColor: "#277874",
  },
  radioText: {
    fontSize: 14,
    color: "#374151",
  },
  radioTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateIcon: {
    marginRight: 4,
  },
  dateTextInput: {
    fontSize: 16,
    color: "#374151",
  },
  datePlaceholder: {
    color: "#9CA3AF",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#277874",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

