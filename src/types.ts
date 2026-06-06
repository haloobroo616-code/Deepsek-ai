export interface HistoryItem {
  user: string;
  assistant: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}
