export const WHATSAPP_NUMBER: string =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "8801XXXXXXXXX";

export const BKASH_NUMBER: string =
  (import.meta.env.VITE_BKASH_NUMBER as string | undefined) ?? "01XXXXXXXXX";

export const NAGAD_NUMBER: string =
  (import.meta.env.VITE_NAGAD_NUMBER as string | undefined) ?? "01XXXXXXXXX";

export const BANK_INFO: string =
  (import.meta.env.VITE_BANK_INFO as string | undefined) ?? "Dutch-Bangla Bank";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_HOURS = "Available 9am – 11pm daily";
