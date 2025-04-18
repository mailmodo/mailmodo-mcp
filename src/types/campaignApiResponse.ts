export interface Campaign {
  campaignType: string;
  templateId: string;
  scheduledAt: number;
  id: string;
  campaignName: string;
  status: string;
  emailType: string;
  senderEmail: string;
  subjects: string[];
  createdAt: number;
  triggerAppName?: string;
  creationSource?: string;
  isShopifyRepeatOrderCampaign?: boolean;
  isShopifyOrderFeedbackCampaign?: boolean;
  isShopifyConfirmedOrderCampaign?: boolean;
}

export interface CampaignApiResponse {
  campaigns: Campaign[];
}