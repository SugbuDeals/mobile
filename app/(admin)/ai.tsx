import env from "@/config/env";
import { useLogin } from "@/features/auth";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface QueryHistory {
  id: number;
  type: 'chat' | 'generate' | 'recommendation';
  query: string;
  count?: number;
  response: string;
  timestamp: Date;
}

export default function AITesting() {
  const { state: authState } = useLogin();
  
  // States for each AI endpoint
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generateResponse, setGenerateResponse] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  
  const [recommendationQuery, setRecommendationQuery] = useState("");
  const [recommendationCount, setRecommendationCount] = useState("10");
  const [recommendationResponse, setRecommendationResponse] = useState("");
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  
  // History state
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);

  // Handle Chat AI
  const handleChatAI = async () => {
    if (!chatMessage.trim() || chatLoading) return;
    
    setChatLoading(true);
    setChatResponse("Processing...");
    
    try {
      const response = await fetch(`${env.API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authState.accessToken ? { Authorization: `Bearer ${authState.accessToken}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: chatMessage }
          ]
        }),
      });
      
      const rawText = await response.text();
      let jsonData: any = {};
      
      try {
        jsonData = rawText ? JSON.parse(rawText) : {};
      } catch {
        jsonData = { content: rawText };
      }
      
      // Extract content from various response formats
      const responseText =
        jsonData?.content ||
        jsonData?.message ||
        jsonData?.response ||
        rawText ||
        "No response received";
      
      setChatResponse(responseText);
      
      // Add to history
      setQueryHistory(prev => [{
        id: Date.now(),
        type: 'chat',
        query: chatMessage,
        response: responseText,
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      const errorText = `Error: ${error}`;
      setChatResponse(errorText);
      
      // Add error to history
      setQueryHistory(prev => [{
        id: Date.now(),
        type: 'chat',
        query: chatMessage,
        response: errorText,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Text Generation AI
  const handleGenerateAI = async () => {
    if (!generatePrompt.trim() || generateLoading) return;
    
    setGenerateLoading(true);
    setGenerateResponse("Processing...");
    
    try {
      const response = await fetch(`${env.API_BASE_URL}/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authState.accessToken ? { Authorization: `Bearer ${authState.accessToken}` } : {}),
        },
        body: JSON.stringify({ prompt: generatePrompt }),
      });
      
      const rawText = await response.text();
      let jsonData: any = {};
      
      try {
        jsonData = rawText ? JSON.parse(rawText) : {};
      } catch {
        jsonData = { content: rawText };
      }
      
      // Extract content from various response formats
      const responseText =
        jsonData?.content ||
        jsonData?.message ||
        jsonData?.response ||
        rawText ||
        "No response received";
      
      setGenerateResponse(responseText);
      
      // Add to history
      setQueryHistory(prev => [{
        id: Date.now(),
        type: 'generate',
        query: generatePrompt,
        response: responseText,
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      const errorText = `Error: ${error}`;
      setGenerateResponse(errorText);
      
      // Add error to history
      setQueryHistory(prev => [{
        id: Date.now(),
        type: 'generate',
        query: generatePrompt,
        response: errorText,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setGenerateLoading(false);
    }
  };

  // Handle Recommendation AI
  const handleRecommendationAI = async () => {
    if (!recommendationQuery.trim() || recommendationLoading) return;
    
    setRecommendationLoading(true);
    setRecommendationResponse("Processing...");
    
    try {
      const response = await fetch(`${env.API_BASE_URL}/ai/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authState.accessToken ? { Authorization: `Bearer ${authState.accessToken}` } : {}),
        },
        body: JSON.stringify({
          query: recommendationQuery,
          count: parseInt(recommendationCount) || 10
        }),
      });
      
      const rawText = await response.text();
      let jsonData: any = {};
      
      try {
        jsonData = rawText ? JSON.parse(rawText) : {};
      } catch {
        jsonData = { content: rawText };
      }
      
      // Extract content from various response formats
      const responseText =
        jsonData?.content ||
        jsonData?.message ||
        jsonData?.response ||
        rawText ||
        "No response received";
      
      setRecommendationResponse(responseText);
      
      // Add to history
      setQueryHistory(prev => [{
        id: Date.now(),
        type: 'recommendation',
        query: recommendationQuery,
        count: parseInt(recommendationCount) || 10,
        response: responseText,
        timestamp: new Date()
      }, ...prev]);
    } catch (error) {
      const errorText = `Error: ${error}`;
      setRecommendationResponse(errorText);
      
      // Add error to history
      setQueryHistory(prev => [{
        id: Date.now(),
        type: 'recommendation',
        query: recommendationQuery,
        count: parseInt(recommendationCount) || 10,
        response: errorText,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setRecommendationLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chat AI Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
              <Text style={styles.sectionTitle}>AI Chat</Text>
              <View style={styles.labelBadge}>
                <Text style={styles.labelText}>/ai/chat</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.description}>
            Chat with AI using conversation messages. Include role (user, assistant, or system) and content.
          </Text>
          
          <TextInput
            style={styles.inputField}
            placeholder="Enter your message..."
            value={chatMessage}
            onChangeText={setChatMessage}
            placeholderTextColor="#9CA3AF"
            multiline
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonMain, chatLoading && styles.actionButtonDisabled]} 
              onPress={handleChatAI}
              disabled={chatLoading}
            >
              {chatLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                setChatMessage("");
                setChatResponse("");
              }}
            >
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {chatResponse && (
            <View style={styles.responseArea}>
              <Text style={styles.responseText}>{chatResponse}</Text>
            </View>
          )}
        </View>

        {/* Text Generation AI Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="create" size={24} color="#10B981" />
              <Text style={styles.sectionTitle}>AI Text Generation</Text>
              <View style={[styles.labelBadge, { backgroundColor: "#D1FAE5" }]}>
                <Text style={[styles.labelText, { color: "#065F46" }]}>/ai/generate</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.description}>
            Generate text based on a prompt. Useful for creating descriptions, content, or creative writing.
          </Text>
          
          <TextInput
            style={styles.inputField}
            placeholder="Enter a prompt (e.g., 'Write a haiku about the sea')..."
            value={generatePrompt}
            onChangeText={setGeneratePrompt}
            placeholderTextColor="#9CA3AF"
            multiline
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.generateButton, styles.actionButtonMain, generateLoading && styles.actionButtonDisabled]} 
              onPress={handleGenerateAI}
              disabled={generateLoading}
            >
              {generateLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Generate Text</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                setGeneratePrompt("");
                setGenerateResponse("");
              }}
            >
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {generateResponse && (
            <View style={styles.responseArea}>
              <Text style={styles.responseText}>{generateResponse}</Text>
            </View>
          )}
                </View>

        {/* Recommendation AI Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="pricetag" size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>AI Recommendations</Text>
              <View style={[styles.labelBadge, { backgroundColor: "#FEF3C7" }]}>
                <Text style={[styles.labelText, { color: "#92400E" }]}>/ai/recommendations</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.description}>
            Get AI-powered product recommendations based on natural language queries. Perfect for deal finding.
          </Text>
          
          <TextInput
            style={styles.inputField}
            placeholder="Enter a query (e.g., 'budget mechanical keyboard')..."
            value={recommendationQuery}
            onChangeText={setRecommendationQuery}
            placeholderTextColor="#9CA3AF"
          />
          
          <View style={styles.countInputContainer}>
            <Text style={styles.countLabel}>Count:</Text>
            <TextInput
              style={styles.countInput}
              placeholder="10"
              value={recommendationCount}
              onChangeText={setRecommendationCount}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.recommendationButton, styles.actionButtonMain, recommendationLoading && styles.actionButtonDisabled]} 
              onPress={handleRecommendationAI}
              disabled={recommendationLoading}
            >
              {recommendationLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="search" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Get Recommendations</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                setRecommendationQuery("");
                setRecommendationCount("10");
                setRecommendationResponse("");
              }}
            >
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {recommendationResponse && (
            <View style={styles.responseArea}>
              <Text style={styles.responseText}>{recommendationResponse}</Text>
            </View>
          )}
        </View>

        {/* Query History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="time" size={24} color="#6B7280" />
              <Text style={styles.sectionTitle}>Recent AI Queries</Text>
              {queryHistory.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setQueryHistory([])}
                  style={styles.clearHistoryIconButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {queryHistory.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Ionicons name="document-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyHistoryText}>No queries yet. Test any AI endpoint to see history here.</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {queryHistory.slice(0, 10).map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyIconContainer}>
                      {item.type === 'chat' && <Ionicons name="chatbubbles" size={16} color="#3B82F6" />}
                      {item.type === 'generate' && <Ionicons name="create" size={16} color="#10B981" />}
                      {item.type === 'recommendation' && <Ionicons name="pricetag" size={16} color="#F59E0B" />}
                    </View>
                    <View style={styles.historyBadge}>
                      <Text style={styles.historyBadgeText}>{item.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  
                  <Text style={styles.historyQuery} numberOfLines={2}>
                    {item.query}
                    {item.count && ` (count: ${item.count})`}
                  </Text>
                  
                  <Text style={styles.historyResponse} numberOfLines={3}>
                    {item.response.substring(0, 150)}...
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // ===== SECTIONS =====
  section: {
    marginBottom: 32,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  labelBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // ===== INPUT FIELDS =====
  inputField: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  countInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  countInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: 80,
  },
  
  // ===== ACTION BUTTONS =====
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonMain: {
    flex: 1,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  refreshButton: {
    width: 48,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  generateButton: {
    backgroundColor: "#10B981",
  },
  recommendationButton: {
    backgroundColor: "#F59E0B",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // ===== RESPONSE AREA =====
  responseArea: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 300,
  },
  responseText: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
  },
  
  // ===== HISTORY SECTION =====
  clearHistoryIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  emptyHistoryContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyHistoryText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  historyIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  historyBadge: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#374151",
  },
  historyTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: "auto",
  },
  historyQuery: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  historyResponse: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
});
