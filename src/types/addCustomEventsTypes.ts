// Types and interfaces
import {z} from 'zod';
export interface EventProperties {
    [key: string]: string | number | boolean | undefined;
}

export interface MailmodoEvent {
    email: string;
    event_name: string;
    ts?: number;
    event_properties?: EventProperties;
}

export const eventPropertiesSchema = z.record(
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.undefined()
    ])
  );

export interface AddCustomeEventResponse {
    // Define your expected response structure here
    success: boolean;
    ref?: string;
}