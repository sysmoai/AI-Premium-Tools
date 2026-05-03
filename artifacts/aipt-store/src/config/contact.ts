export const WHATSAPP_NUMBER: string =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "8801970679938";

export const BKASH_NUMBER: string =
  (import.meta.env.VITE_BKASH_NUMBER as string | undefined) ?? "01970679938";

export const NAGAD_NUMBER: string =
  (import.meta.env.VITE_NAGAD_NUMBER as string | undefined) ?? "01970679938";

export const BANK_INFO: string =
  (import.meta.env.VITE_BANK_INFO as string | undefined) ?? "Dutch-Bangla Bank";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_HOURS = "Available 10am – 11pm daily";
