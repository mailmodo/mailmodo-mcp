// Types for Mailmodo API Response
export interface Template {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  format: string;
  thumbnail_url: string;
  type: string;
  created_by: string;
  state: string;
  is_uploaded: string;
}

export interface TemplateApiResponse {
  templateDetails: Template[];
}