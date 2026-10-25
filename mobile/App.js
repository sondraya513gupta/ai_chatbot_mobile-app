import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

// Change this to your computer's LAN IP when testing on a physical phone.
// Android emulator: http://10.0.2.2:3000
// iOS simulator: http://localhost:3000
const API_BASE_URL = "https://ai-chatbot-mobile-app.onrender.com";

const suggestions = [
  "Explain artificial intelligence",
  "Give me 5 study tips",
  "What is Python used for?"
];

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! 👋 I'm Pocket AI. Ask me anything and I'll do my best to help."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "Pocket AI — Everyday AI Assistant";
    }
  }, []);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  async function sendMessage(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMessage = { id: `${Date.now()}-user`, role: "user", content: text };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setInput("");
    setLoading(true);

    try {
      const payloadMessages = conversation
        .filter((m) => m.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");

      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: "assistant", content: data.reply }
      ]);
    } catch (error) {
      let message = error.message || "Unable to connect to the server.";
      if (message.includes("Network request failed")) {
        message =
          "Can't reach the backend. Check that the server is running and API_BASE_URL in App.js uses your computer's local IP.";
      }
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-error`, role: "assistant", content: `⚠️ ${message}` }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    if (loading) return;
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! What would you like to ask?"
      }
    ]);
  }

  function renderMessage({ item }) {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && <View style={styles.avatar}><Text style={styles.avatarText}>✦</Text></View>}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.header}>
          <View style={styles.brandIcon}><Text style={styles.brandIconText}>✦</Text></View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Pocket AI</Text>
            <Text style={styles.subtitle}>Your everyday AI assistant</Text>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton} accessibilityLabel="Clear chat">
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusText}>Ready to help</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            loading ? (
              <View style={[styles.messageRow, styles.botRow]}>
                <View style={styles.avatar}><Text style={styles.avatarText}>✦</Text></View>
                <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
                  <ActivityIndicator size="small" color="#6759D6" />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {messages.length <= 1 && (
          <View style={styles.suggestionsWrap}>
            <Text style={styles.suggestionsTitle}>TRY ASKING</Text>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestion}
                onPress={() => sendMessage(suggestion)}
                disabled={loading}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
                <Text style={styles.suggestionArrow}>↗</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything..."
              placeholderTextColor="#9297A5"
              style={styles.input}
              multiline
              maxLength={2000}
              editable={!loading}
              onSubmitEditing={() => sendMessage()}
              onKeyPress={(e) => {
                if (Platform.OS === "web" && e.nativeEvent?.key === "Enter" && !e.nativeEvent?.shiftKey) {
                  e.preventDefault?.();
                  sendMessage();
                }
              }}
              returnKeyType="send"
              blurOnSubmit
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              accessibilityLabel="Send message"
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>AI can make mistakes. Check important information.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? "#EBEFF5" : "#F5F7FB"
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
        }
      : {})
  },
  header: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
    paddingTop: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#E9ECF4"
  },
  brandIcon: {
    width: 44, height: 44, borderRadius: 15, backgroundColor: "#6759D6",
    alignItems: "center", justifyContent: "center", marginRight: 12
  },
  brandIconText: { color: "#FFFFFF", fontSize: 25, fontWeight: "700" },
  headerCopy: { flex: 1 },
  title: { fontSize: 21, fontWeight: "800", color: "#1D2140", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: "#81879A", marginTop: 2 },
  clearButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#ECEAFB" },
  clearButtonText: { color: "#5F51C6", fontWeight: "700", fontSize: 12 },
  statusPill: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center",
    backgroundColor: "#E8F7F0", paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 20, marginLeft: 20, marginTop: 12
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2CA875", marginRight: 7 },
  statusText: { color: "#28865F", fontSize: 11, fontWeight: "700" },
  chatContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16, flexGrow: 1 },
  messageRow: { flexDirection: "row", marginBottom: 15, alignItems: "flex-end" },
  userRow: { justifyContent: "flex-end" },
  botRow: { justifyContent: "flex-start" },
  avatar: {
    width: 29, height: 29, borderRadius: 10, backgroundColor: "#E8E5FC",
    alignItems: "center", justifyContent: "center", marginRight: 8, marginBottom: 2
  },
  avatarText: { color: "#6759D6", fontSize: 16, fontWeight: "800" },
  bubble: { maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18 },
  userBubble: { backgroundColor: "#6759D6", borderBottomRightRadius: 5 },
  botBubble: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 5, borderWidth: 1, borderColor: "#ECEEF5" },
  messageText: { fontSize: 14, lineHeight: 21, color: "#30354A" },
  userMessageText: { color: "#FFFFFF" },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14 },
  typingText: { color: "#777D91", fontSize: 13 },
  suggestionsWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  suggestionsTitle: { fontSize: 10, color: "#9398A8", fontWeight: "800", letterSpacing: 1.4, marginBottom: 9 },
  suggestion: {
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E8EAF2",
    borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 7,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between"
  },
  suggestionText: { color: "#4A5066", fontSize: 13, fontWeight: "600" },
  suggestionArrow: { color: "#6759D6", fontSize: 17, marginLeft: 10 },
  composerWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 8 : 12, borderTopWidth: 1, borderTopColor: "#E9ECF4", backgroundColor: "#F5F7FB" },
  composer: {
    flexDirection: "row", alignItems: "flex-end", backgroundColor: "#FFFFFF",
    borderRadius: 18, borderWidth: 1, borderColor: "#E4E7F0", paddingLeft: 14,
    paddingRight: 7, paddingVertical: 7, minHeight: 52
  },
  input: { flex: 1, maxHeight: 100, paddingTop: 9, paddingBottom: 8, fontSize: 14, color: "#272B40" },
  sendButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#6759D6", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  sendButtonDisabled: { backgroundColor: "#C7C3EE" },
  sendIcon: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginTop: -2 },
  disclaimer: { textAlign: "center", color: "#A0A4B2", fontSize: 10, marginTop: 8 }
});
