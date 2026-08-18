import type { Metadata } from "next";
import { ConversationList } from "@/modules/conversations/components/ConversationList";

export const metadata: Metadata = { title: "Conversations" };

export default function ConversationsPage() {
  return <ConversationList />;
}
