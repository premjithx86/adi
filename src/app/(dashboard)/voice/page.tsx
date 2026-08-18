import type { Metadata } from "next";
import { VoiceInterface } from "@/modules/voice/components/VoiceInterface";

export const metadata: Metadata = { title: "Voice Testing" };

export default function VoicePage() {
  return <VoiceInterface />;
}
