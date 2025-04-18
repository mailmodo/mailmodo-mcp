import axios from 'axios';
import { TemplateApiResponse } from 'types/templateApiResponse.js';
export async function fetchAllTemplates(): Promise<TemplateApiResponse> {
    try {
      const response = await axios.get('https://api.mailmodo.com/api/v1/getAllTemplates', {
        headers: {
          'Accept': 'application/json',
          'mmApiKey': process.env.MAILMODO_API_KEY || ''
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Mailmodo templates:', error);
      return { templateDetails: [] };
    }
  }