export type SmsPayload = {
  phone_number: string;
  message: string;
};

export type ClaimQueueJobResource = {
  id: number;
  job_type: "send_sms";
  payload: SmsPayload;
  priority: number;
  attempts: number;
  max_attempts: number;
  worker_id: number | null;
  locked_at: string | null;
  reserved_at: string | null;
};
