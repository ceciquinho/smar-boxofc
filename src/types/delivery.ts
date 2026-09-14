export type DeliveryStatus = "pending" | "in_transit" | "ready_for_pickup" | "delivered" | "failed";
export type TokenStatus = "active" | "used" | "expired";

export type Delivery = {
  id: string;
  order_id: string;
  recipient_name: string;
  recipient_address: string | null;
  notes: string | null;
  status: DeliveryStatus;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
};

export type DeliveryInsert = {
  order_id: string;
  recipient_name: string;
  recipient_address?: string | null;
  notes?: string | null;
  status?: DeliveryStatus;
};

export type DeliveryToken = {
  id: string;
  delivery_id: string;
  token: string;
  status: TokenStatus;
  expires_at: string;
  created_at: string;
  used_at: string | null;
};

export type AccessLog = {
  id: string;
  delivery_id: string | null;
  token: string;
  success: boolean;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
};
