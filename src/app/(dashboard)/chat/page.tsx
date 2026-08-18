import type { Metadata } from "next";
import { ChatInterface } from "@/modules/chat/components/ChatInterface";

export const metadata: Metadata = { title: "Chat Testing" };

export default function ChatPage() {
  return <ChatInterface />;
}
