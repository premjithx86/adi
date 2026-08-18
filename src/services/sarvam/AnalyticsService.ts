import { SarvamClient, type SarvamInteraction } from "./SarvamClient";

export interface AnalyticsSummary {
  totalInteractions: number;
  voiceInteractions: number;
  chatInteractions: number;
  avgDurationSeconds: number;
  languageDistribution: Record<string, number>;
  interactions: SarvamInteraction[];
}

export class AnalyticsService {
  private readonly client: SarvamClient;

  constructor() {
    this.client = new SarvamClient();
  }

  async getSummary(days = 30): Promise<AnalyticsSummary> {
    const endDatetime = new Date().toISOString();
    const startDatetime = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    try {
      const response = await this.client.getInteractions({
        startDatetime,
        endDatetime,
        limit: 100,
      });

      const interactions = response.items;
      const voiceCount = interactions.filter(
        (i) => i.channel_type === "phone" || i.channel_type === "voice"
      ).length;
      const chatCount = interactions.filter(
        (i) => i.channel_type === "chat" || i.channel_type === "web"
      ).length;

      const totalDuration = interactions.reduce(
        (sum, i) => sum + (i.duration_in_seconds ?? 0),
        0
      );

      const languageDistribution: Record<string, number> = {};
      for (const i of interactions) {
        const lang = i.language_name || "Unknown";
        languageDistribution[lang] = (languageDistribution[lang] ?? 0) + 1;
      }

      return {
        totalInteractions: response.total,
        voiceInteractions: voiceCount,
        chatInteractions: chatCount,
        avgDurationSeconds:
          interactions.length > 0
            ? Math.round(totalDuration / interactions.length)
            : 0,
        languageDistribution,
        interactions,
      };
    } catch {
      return {
        totalInteractions: 0,
        voiceInteractions: 0,
        chatInteractions: 0,
        avgDurationSeconds: 0,
        languageDistribution: {},
        interactions: [],
      };
    }
  }
}
