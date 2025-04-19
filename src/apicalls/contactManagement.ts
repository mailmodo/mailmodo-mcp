import axios from "axios";
import { AxiosError } from "axios";
import { AddBatchContactToListResponse, AddContactToListResponse, BulkMailmodoContact, MailmodoContact, GetContactListsResponse } from "types/addContactsTypes";

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

export async function bulkAddContactToList(
    payload: BulkMailmodoContact
): Promise<AddBatchContactToListResponse> {
    const allHaveEmails = payload.values.every(user => typeof user.email === 'string' && user.email.trim() !== '');
    if (!allHaveEmails || !payload.listName) {
        throw new Error('Email and listname are required fields');
    }

    try {
        const response = await axios.post<AddBatchContactToListResponse>(
            'https://api.mailmodo.com/api/v1/addToList/batch',
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
            return {listId: ''}
        }
        throw new Error('An unexpected error occurred');
    }
}

/**
 * Retrieves all contact lists from Mailmodo API
 * @returns Promise with the API response containing all contact lists
 * @throws AxiosError if the request fails
 */
export async function getAllContactLists(): Promise<GetContactListsResponse> {
    try {
        const response = await axios.get<GetContactListsResponse>(
            'https://api.mailmodo.com/api/v1/getAllContactLists',
            {
                headers: {
                    'Accept': 'application/json',
                    'mmApiKey': process.env.MAILMODO_API_KEY || ''
                }
            }
        );

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                listDetails: [],
            };
        }
        throw new Error('An unexpected error occurred');
    }
}

/**
 * Unsubscribes a contact using their email address
 * @param email - Email address of the contact to unsubscribe
 * @returns Promise with the API response
 * @throws Error if email is not provided or if an unexpected error occurs
 */
export async function unsubscribeContact(
    email: string
): Promise<AddContactToListResponse> {
    if (!email) {
        throw new Error('Email is a required field');
    }

    try {
        const response = await axios.post<AddContactToListResponse>(
            'https://api.mailmodo.com/api/v1/contacts/unsubscribe',
            {
                email,
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
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to unsubscribe contact'
            };
        }
        throw new Error('An unexpected error occurred');
    }
}

/**
 * Resubscribes a contact using their email address
 * @param email - Email address of the contact to unsubscribe
 * @returns Promise with the API response
 * @throws Error if email is not provided or if an unexpected error occurs
 */
export async function resubscribeContact(
    email: string
): Promise<AddContactToListResponse> {
    if (!email) {
        throw new Error('Email is a required field');
    }

    try {
        const response = await axios.post<AddContactToListResponse>(
            'https://api.mailmodo.com/api/v1/contacts/resubscribe',
            {
                email,
            },
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'mmApiKey': process.env.MAILMODO_API_KEY || ''
                }
            }
        );

        return {success: true, message: response.data.message};
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to unsubscribe contact'
            };
        }
        throw new Error('An unexpected error occurred');
    }
}

/**
 * Retrieves contact details for a specific email from Mailmodo API
 * @param email - Email address of the contact to retrieve details for
 * @returns Promise with the API response containing contact details
 * @throws Error if email is not provided or if an unexpected error occurs
 */
export async function getContactDetails(
    email: string
): Promise<any | null> {
    if (!email) {
        throw new Error('Email is a required field');
    }

    try {
        const response = await axios.get<any>(
            `https://api.mailmodo.com/api/v1/getContactDetails?email=${encodeURIComponent(email)}`,
            {
                headers: {
                    'Accept': 'application/json',
                    'mmApiKey': process.env.MAILMODO_API_KEY || ''
                }
            }
        );

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            return null;
        }
        throw new Error('An unexpected error occurred');
    }
}

/**
 * Removes a contact from a specified list in Mailmodo
 * @param email - Email address of the contact to remove
 * @param listName - Name of the list from which to remove the contact
 * @returns Promise with the response message
 * @throws AxiosError if the API call fails
 */
export const removeContactFromList = async (
    email: string,
    listName: string
  ): Promise<AddContactToListResponse> => {
    try {
      const response = await axios.post<AddContactToListResponse>(
        'https://api.mailmodo.com/api/v1/removeFromList',
        {
          email,
          listName
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw error;
      }
      throw new Error('Failed to remove contact from list');
    }
  };

  /**
 * Deletes a contact from Mailmodo
 * @param email - Email address of the contact to delete
 * @returns Promise with the API response
 * @throws Error if an unexpected error occurs
 */
export async function deleteContact(
    email: string
): Promise<AddContactToListResponse> {
    if (!email) {
        throw new Error('Email is a required field');
    }

    try {
        const response = await axios.delete<AddContactToListResponse>(
            'https://api.mailmodo.com/api/v1/contacts',
            {
                headers: {
                    'Accept': 'application/json',
                    'mmApiKey': process.env.MAILMODO_API_KEY || ''
                },
                data: { email }
            }
        );

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete contact'
            };
        }
        throw new Error('An unexpected error occurred');
    }
}
