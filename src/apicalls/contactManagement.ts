import axios from "axios";
import { AxiosError } from "axios";
import { AddContactToListResponse, MailmodoContact } from "types/addContactsTypes";

/**
 * Sends an event to Mailmodo API using axios
 * @param payload - Event data to be sent
 * @returns Promise with the API response
 * @throws AxiosError if the request fails
 */
export async function addContactToList(
    payload: MailmodoContact
): Promise<AddContactToListResponse> {

    if (!payload.email || !payload.listName) {
        throw new Error('Email and listname are required fields');
    }

    try {
        const response = await axios.post<AddContactToListResponse>(
            'https://api.mailmodo.com/api/v1/addToList',
            {
                ...payload,
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