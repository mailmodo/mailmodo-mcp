// Types and interfaces
import {z} from 'zod';
export interface UserProperties {
    [key: string]: string | number | boolean | undefined;
}
const dateSchema = z.union([
  z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid ISO date string",
  }),
  z.number().int(),
]);
// Helper regex for ISO 8601 date format
const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/;

// Helper regex for UNIX timestamp (10 or 13 digits)
const unixTimestampRegex = /^\d{10}(?:\d{3})?$/;

// Schema to validate ISO 8601 or UNIX timestamp strings
export const datetimeSchema = z
  .string()
  .refine(
    (s) => iso8601Regex.test(s) || unixTimestampRegex.test(s),
    {
      message: "Must be a valid ISO 8601 date or UNIX timestamp",
    }
  );

// Basic timezone regex (e.g., "America/New_York")
export const timezoneRegex = /^[A-Za-z_]+(?:\/[A-Za-z_]+(?:\/[A-Za-z_]+)?)?$/;

export interface MailmodoContact {
    email: string;
    listName: string;
    data?: UserProperties;
    created_at?: string;  // ISO 8601 or UNIX timestamp
    last_click?: string;  // ISO 8601 or UNIX timestamp
    last_open?: string;   // ISO 8601 or UNIX timestamp
    timezone?: string;   // Region format timezone
}
export interface MailmodoContactWithoutList {
  email: string;
  data?: UserProperties;
  created_at?: string;  // ISO 8601 or UNIX timestamp
  last_click?: string;  // ISO 8601 or UNIX timestamp
  last_open?: string;   // ISO 8601 or UNIX timestamp
  timezone?: string;   // Region format timezone
}


export interface BulkMailmodoContact{
  listName: string;
  values: MailmodoContactWithoutList[]
}
export const contactPropertiesSchema = z.object({
  first_name: z.string().describe("First name of the user").optional(),
  last_name: z.string().describe("Last name of the user").optional(),
  name: z.string().describe("Full name of the user").optional(),
  gender: z.string().describe("Gender of the user").optional(),
  age: z.number().int().describe("Age of the user in numbers").optional(),
  birthday: dateSchema.describe("Birthdate of the user (ISO format or UNIX timestamp)").optional(),
  phone: z.string().describe("Primary phone number of the user").optional(),
  address1: z.string().describe("Line 1 of the address of the user").optional(),
  address2: z.string().describe("Line 2 of the address of the user").optional(),
  city: z.string().describe("City/district/village of the user").optional(),
  state: z.string().describe("State, region or province of the user").optional(),
  country: z.string().describe("Country of the user").optional(),
  postal_code: z.string().describe("PIN/ZIP Code of the user").optional(),
  designation: z.string().describe("Designation of the user").optional(),
  company: z.string().describe("Company of the user").optional(),
  industry: z.string().describe("Industry of the user").optional(),
  description: z.string().describe("Description of the user").optional(),
  anniversary_date: dateSchema.describe("Anniversary date (ISO format or UNIX timestamp)").optional(),
}).catchall(
  // Allow any additional key-value pairs of types: string, number, boolean, or undefined
  z.union([z.string(), z.number(), z.boolean(), z.undefined()])
);
export interface AddContactToListResponse {
    // Define your expected response structure here
    success: boolean;
    message?: string;
}

export interface AddBatchContactToListResponse {
  // Define your expected response structure here
  listId: string;
  message?: string;
}

// New interfaces for contact list response
export interface ContactListDetails {
  id: string;
  name: string;
  created_at: string;
  contacts_count: number;
}

export interface GetContactListsResponse {
  listDetails: ContactListDetails[];
}
