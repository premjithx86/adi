export const sarvamConfig = {
  orgId: process.env.SARVAM_ORG_ID!,
  workspaceId: process.env.SARVAM_WORKSPACE_ID!,
  appId: process.env.SARVAM_APP_ID!,
  apiKey: process.env.SARVAM_API_KEY!,
  analyticsBaseUrl: `https://apps.sarvam.ai/api/analytics/v1/${process.env.SARVAM_ORG_ID}/${process.env.SARVAM_WORKSPACE_ID}/${process.env.SARVAM_APP_ID}`,
  deploymentBaseUrl: `https://apps.sarvam.ai/api/app-authoring/v1/orgs/${process.env.SARVAM_ORG_ID}/workspaces/${process.env.SARVAM_WORKSPACE_ID}`,
} as const;

export const defaultAgentVariables: Record<string, string> = {
  budget_range: "",
  business_name: "Adivinar",
  call_summary: "",
  caller_name: "",
  gender: "",
  lead_disposition: "",
  service_interest: "",
  user_name: "",
};
