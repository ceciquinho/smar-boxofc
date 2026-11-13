import { apiRequest } from "@/services/apiClient";
import type { AccessLog, Delivery, DeliveryInsert, DeliveryToken } from "@/types/delivery";

type ValidateTokenResponse = {
  success: boolean;
  reason: string;
  delivery?: Delivery;
};

export async function fetchDeliveries() {
  return apiRequest<Delivery[]>("/deliveries");
}

export async function fetchDelivery(id: string) {
  return apiRequest<Delivery>(`/deliveries/${id}`);
}

export async function createDelivery(delivery: DeliveryInsert) {
  return apiRequest<Delivery>("/deliveries", {
    method: "POST",
    body: JSON.stringify(delivery),
  });
}

export async function generateToken(deliveryId: string, expiresInMinutes = 10) {
  return apiRequest<DeliveryToken>(`/deliveries/${deliveryId}/tokens`, {
    method: "POST",
    body: JSON.stringify({ expires_in_minutes: expiresInMinutes }),
  });
}

export async function fetchActiveToken(deliveryId: string) {
  return apiRequest<DeliveryToken | null>(`/deliveries/${deliveryId}/active-token`);
}

export async function validateToken(token: string) {
  return apiRequest<ValidateTokenResponse>("/box/validate", {
    method: "POST",
    body: JSON.stringify({ token, box_id: "BOX-001" }),
  });
}

export async function fetchAccessLogs(deliveryId?: string) {
  const query = deliveryId ? `?delivery_id=${encodeURIComponent(deliveryId)}` : "";
  return apiRequest<AccessLog[]>(`/access-logs${query}`);
}
