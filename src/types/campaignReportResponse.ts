export type CampaignType = 'TRIGGERED' | 'SCHEDULED' | 'DRAFT'; // Add other possible values if needed
export type CampaignStatus = 'Triggered' | 'Scheduled' | 'Draft' | 'Completed'; // Add other possible values if needed

export interface CampaignReportData {
  campaignId: string;
  campaignType: CampaignType;
  campaignName: string;
  status: CampaignStatus;
  senderEmail: string;
  subjects: string[];
  createdAt: string;
  scheduledAt: string;
  
  // Analytics metrics
  bounced: number;
  complaints: number;
  submission: number;
  unsubscribed: number;
  blocked: number;
  scheduled: number;
  sent: number;
  delivered: number;
  
  // Engagement metrics
  clicks: number;
  ampClicks: number;
  htmlClicks: number;
  ampOpens: number;
  htmlOpens: number;
  opens: number;
}

export interface CampaignReportResponse{
    success: boolean,
    data: CampaignReportData | null;
}