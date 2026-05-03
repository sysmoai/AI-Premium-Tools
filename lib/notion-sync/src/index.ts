import { ReplitConnectors } from "@replit/connectors-sdk";

export const NOTION_DB = {
  customers: "31cc4f53-11fe-43ad-bfad-9419922e2412",
  orders: "ab25c567-87d8-4bb9-a04e-42b779080eaa",
  products: "09b32725-77f1-4289-9bc0-147b4b264539",
} as const;

const connectors = new ReplitConnectors();

export type CustomerSync = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  university: string | null;
  totalOrders?: number;
  totalRevenue?: number;
  firstOrderAt?: Date | null;
  lastOrderAt?: Date | null;
};

export type ProductSync = {
  id: number;
  name: string;
  description: string | null;
  priceBdt: number;
  originalPriceBdt: number | null;
  categoryName: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  orderCount: number;
};

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";
export type PaymentMethod = "bkash" | "nagad" | "bank_transfer";

export type OrderSync = {
  id: number;
  customerName: string | null;
  customerPhone: string | null;
  productSummary: string;
  totalBdt: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentRef: string | null;
  notes: string | null;
  createdAt: Date;
};

async function notion<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await connectors.proxy("notion", path, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body == null ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion ${init?.method ?? "GET"} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

type NotionPage = { id: string };
type NotionQueryResponse = { results: NotionPage[] };

async function findPageByNumber(databaseId: string, prop: string, value: number): Promise<string | null> {
  const r = await notion<NotionQueryResponse>(`/v1/databases/${databaseId}/query`, {
    method: "POST",
    body: { filter: { property: prop, number: { equals: value } }, page_size: 1 },
  });
  return r.results[0]?.id ?? null;
}

async function findPageByPhone(databaseId: string, prop: string, value: string): Promise<string | null> {
  const r = await notion<NotionQueryResponse>(`/v1/databases/${databaseId}/query`, {
    method: "POST",
    body: { filter: { property: prop, phone_number: { equals: value } }, page_size: 1 },
  });
  return r.results[0]?.id ?? null;
}

async function findPageByText(databaseId: string, prop: string, value: string): Promise<string | null> {
  const r = await notion<NotionQueryResponse>(`/v1/databases/${databaseId}/query`, {
    method: "POST",
    body: { filter: { property: prop, rich_text: { equals: value } }, page_size: 1 },
  });
  return r.results[0]?.id ?? null;
}

function rt(text: string | null | undefined) {
  if (!text) return { rich_text: [] };
  return { rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }] };
}
function title(text: string) {
  return { title: [{ type: "text", text: { content: (text || "(untitled)").slice(0, 1900) } }] };
}
function num(n: number | null | undefined) {
  return { number: n == null || !Number.isFinite(n) ? null : n };
}
function checkbox(v: boolean) {
  return { checkbox: !!v };
}
function dateProp(d: Date | null | undefined) {
  return { date: d ? { start: d.toISOString() } : null };
}
function urlProp(u: string | null | undefined) {
  return { url: u && u.trim() ? u : null };
}
function emailProp(e: string | null | undefined) {
  return { email: e && e.trim() ? e : null };
}
function phoneProp(p: string | null | undefined) {
  return { phone_number: p && p.trim() ? p : null };
}
function selectProp(name: string | null | undefined) {
  return { select: name ? { name } : null };
}

const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  bank_transfer: "Bank Transfer",
};
const STATUS_MAP: Record<OrderStatus, string> = {
  pending: "Payment Pending",
  confirmed: "Paid",
  delivered: "Delivered",
  cancelled: "Churned",
};
const PAYMENT_STATUS_MAP: Record<OrderStatus, string> = {
  pending: "Not Paid",
  confirmed: "Paid Full",
  delivered: "Paid Full",
  cancelled: "Refunded",
};

export async function upsertCustomer(c: CustomerSync): Promise<void> {
  const phone = (c.phone ?? "").trim();
  if (!phone) {
    // No stable identity key — refuse rather than create duplicates.
    throw new Error(`upsertCustomer: customer ${c.id} has no phone; cannot identify Notion row`);
  }
  const properties: Record<string, unknown> = {
    "Customer Name": title(c.name),
    "WhatsApp": phoneProp(phone),
    "Email": emailProp(c.email),
    "Total Orders": num(c.totalOrders ?? 0),
    "Total Revenue": num(c.totalRevenue ?? 0),
    "First Order Date": dateProp(c.firstOrderAt ?? null),
    "Last Order Date": dateProp(c.lastOrderAt ?? null),
    "Business Name": rt(c.university),
    "Stage": selectProp((c.totalOrders ?? 0) > 0 ? "Customer" : "Lead"),
    "Status": selectProp((c.totalOrders ?? 0) > 0 ? "Active" : "Prospect"),
    "Industry": selectProp(c.university ? "Student" : null),
  };

  const existingId = await findPageByPhone(NOTION_DB.customers, "WhatsApp", phone);
  if (existingId) {
    await notion(`/v1/pages/${existingId}`, { method: "PATCH", body: { properties } });
  } else {
    await notion(`/v1/pages`, {
      method: "POST",
      body: { parent: { database_id: NOTION_DB.customers }, properties },
    });
  }
}

/**
 * Soft-delete a product in Notion by setting Active=false.
 * We do NOT archive the page so order history referencing the product stays readable.
 */
export async function deleteProduct(id: number): Promise<void> {
  const existingId = await findPageByNumber(NOTION_DB.products, "PG_ID", id);
  if (!existingId) return;
  await notion(`/v1/pages/${existingId}`, {
    method: "PATCH",
    body: {
      properties: {
        "Active": checkbox(false),
        "Updated At": dateProp(new Date()),
      },
    },
  });
}

export async function upsertProduct(p: ProductSync): Promise<void> {
  const properties: Record<string, unknown> = {
    "Name": title(p.name),
    "PG_ID": num(p.id),
    "Description": rt(p.description),
    "Price BDT": num(p.priceBdt),
    "Original Price BDT": num(p.originalPriceBdt),
    "Category": rt(p.categoryName),
    "Active": checkbox(p.isActive),
    "Featured": checkbox(p.isFeatured),
    "Order Count": num(p.orderCount),
    "Image URL": urlProp(p.imageUrl),
    "Updated At": dateProp(new Date()),
  };

  const existingId = await findPageByNumber(NOTION_DB.products, "PG_ID", p.id);
  if (existingId) {
    await notion(`/v1/pages/${existingId}`, { method: "PATCH", body: { properties } });
  } else {
    await notion(`/v1/pages`, {
      method: "POST",
      body: { parent: { database_id: NOTION_DB.products }, properties },
    });
  }
}

export async function upsertOrder(o: OrderSync): Promise<void> {
  const orderId = `AIPT-${o.id}`;
  const orderTitle = `${o.customerName ?? "Unknown"} - Order #${o.id}`;
  const noteParts = [o.notes, o.paymentRef ? `Payment Ref: ${o.paymentRef}` : null, `Items: ${o.productSummary}`]
    .filter(Boolean)
    .join("\n");

  const properties: Record<string, unknown> = {
    "Order": title(orderTitle),
    "Order ID": rt(orderId),
    "Customer Name": rt(o.customerName),
    "Contact": phoneProp(o.customerPhone),
    "Amount": num(o.totalBdt),
    "Currency": selectProp("BDT"),
    "Date": dateProp(o.createdAt),
    "Payment Method": selectProp(PAYMENT_METHOD_MAP[o.paymentMethod]),
    "Status": selectProp(STATUS_MAP[o.status]),
    "Payment Status": selectProp(PAYMENT_STATUS_MAP[o.status]),
    "Channel": selectProp("Website"),
    "Notes": rt(noteParts || null),
  };

  const existingId = await findPageByText(NOTION_DB.orders, "Order ID", orderId);
  if (existingId) {
    await notion(`/v1/pages/${existingId}`, { method: "PATCH", body: { properties } });
  } else {
    await notion(`/v1/pages`, {
      method: "POST",
      body: { parent: { database_id: NOTION_DB.orders }, properties },
    });
  }
}
