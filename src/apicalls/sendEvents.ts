
import axios from "axios";
import { AxiosError } from "axios";
import { AddCustomeEventResponse, MailmodoEvent } from "types/addCustomEventsTypes";

/**
 * Sends an event to Mailmodo API using axios
 * @param apiKey - Mailmodo API key
 * @param payload - Event data to be sent
 * @returns Promise with the API response
 * @throws AxiosError if the request fails
 */
export async function addMailmodoEvent(
    payload: MailmodoEvent
): Promise<AddCustomeEventResponse> {

    if (!payload.email || !payload.event_name) {
        throw new Error('Email and event_name are required fields');
    }

    try {
        const response = await axios.post<AddCustomeEventResponse>(
            'https://api.mailmodo.com/api/v1/addEvent',
            {
                ...payload,
                ts: payload.ts || Math.floor(Date.now() / 1000)
            },
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
        if (error instanceof AxiosError) {
            return {success: false}
        }
        throw new Error('An unexpected error occurred');
    }
}