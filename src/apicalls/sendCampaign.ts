
import axios from 'axios';
import { BulkTriggerCampaignRequest, TriggerCampaignRequest, TriggerCampaignResponse } from 'types/triggerCampaignTypes';

/**
 * Triggers a Mailmodo campaign for the specified campaign ID
 * @param campaignId - The ID of the campaign to trigger
 * @param payload - Campaign trigger request data
 * @returns Promise with the campaign trigger response
 */
export async function triggerMailmodoCampaign(
  campaignId: string,
  payload: TriggerCampaignRequest
): Promise<TriggerCampaignResponse> {
  try {
    const response = await axios.post<TriggerCampaignResponse>(
      `https://api.mailmodo.com/api/v1/triggerCampaign/${campaignId}`,
      payload,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'mmApiKey': process.env.MAILMODO_API_KEY || ''
        }
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to trigger Mailmodo campaign: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Triggers a Mailmodo campaign in bulk for a list of recipients
 * @param campaignId - The ID of the campaign to trigger
 * @param payload - Bulk campaign trigger request data
 * @returns Promise with the campaign trigger response
 */
export async function bulkTriggerMailmodoCampaign(
    campaignId: string,
    payload: BulkTriggerCampaignRequest
  ): Promise<TriggerCampaignResponse> {
    try {
      const response = await axios.post<TriggerCampaignResponse>(
        `https://api.mailmodo.com/api/v1/bulktriggerCampaign/${campaignId}`,
        payload,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'mmApiKey': process.env.MAILMODO_API_KEY || ''
          }
        }
      );
  
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to bulk trigger Mailmodo campaign: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }