import axios from 'axios';
import { CampaignApiResponse } from 'types/campaignApiResponse';
import { CampaignReportResponse } from 'types/campaignReportResponse';

export async function fetchAllCampaigns(mmApiKey: string): Promise<CampaignApiResponse> {
    try {
      const response = await axios.get('https://api.mailmodo.com/api/v1/campaigns', {
        headers: {
          'Accept': 'application/json',
          'mmApiKey': mmApiKey || ''
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Mailmodo templates:', error);
      return { campaigns: [] };
    }
  }

export async function fetchCampaignReport(
  mmApiKey: string,
  campaignId: string,
  fromDate: string, toDate: string
): Promise<CampaignReportResponse> {
  try {
    const response = await axios.post(
      `https://api.mailmodo.com/api/v1/campaignReports/${campaignId}`,
      {
        fromDate,
        toDate
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'mmApiKey': mmApiKey || ''
        }
      }
    );
    return {success: true, data: response.data};
  } catch (error) {
    console.error('Error fetching campaign report:', error);
    return {success: false, data: null};
  }
}
