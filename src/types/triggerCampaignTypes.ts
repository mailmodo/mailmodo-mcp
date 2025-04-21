
  
  export interface TriggerCampaignRequest {
    email: string;
    subject?: string;
    replyTo?: string;
    fromName?: string;
    campaign_data?: Record<string, string>;
    data?: Record<string, string>;
    addToList?: string;
  }
  
  export interface TriggerCampaignResponse {
    success: boolean;
    message: string;
    ref: string;
  }

  export interface BulkTriggerCampaignRequest {
    listId: string;
    subject?: string;
    idempotencyKey?: string;
    campaign_data?: Record<string, string>;
  }