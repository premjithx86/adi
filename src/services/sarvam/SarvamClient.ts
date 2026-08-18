import { sarvamConfig } from "@/config/sarvam";

export class SarvamClient {
  private readonly apiKey: string;
  private readonly analyticsBase: string;

  constructor() {
    this.apiKey = sarvamConfig.apiKey;
    this.analyticsBase = sarvamConfig.analyticsBaseUrl;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Sarvam API error ${response.status}: ${text || response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getInteractions(params: {
    startDatetime: string;
    endDatetime: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams({
      start_datetime: params.startDatetime,
      end_datetime: params.endDatetime,
      limit: String(params.limit ?? 20),
      offset: String(params.offset ?? 0),
      sort_order: "desc",
    });

    return this.request<SarvamInteractionsResponse>(
      `${this.analyticsBase}/interactions?${query}`
    );
  }

  async getTranscript(interactionId: string) {
    return this.request<unknown>(
      `${this.analyticsBase}/transcripts/${interactionId}`
    );
  }

  async getDeployments() {
    return this.request<SarvamDeploymentsResponse>(
      `${sarvamConfig.deploymentBaseUrl}/deployments`
    );
  }
}

export interface SarvamInteraction {
  interaction_id: string;
  user_identifier: string;
  duration_in_seconds: number;
  start_datetime: string;
  end_datetime: string;
  language_name: string;
  num_messages: number;
  channel_type: string;
  agent_variables: Record<string, string>;
  ended_by: string;
  failure_reason: string | null;
}

export interface SarvamInteractionsResponse {
  items: SarvamInteraction[];
  total: number;
  limit: number;
  offset: number;
  next_page_uri: string | null;
}

export interface SarvamDeploymentsResponse {
  items: Array<{
    deployment_id: string;
    app_id: string;
    status: string;
    name: string;
    channel_direction: string;
  }>;
  total: number;
}
