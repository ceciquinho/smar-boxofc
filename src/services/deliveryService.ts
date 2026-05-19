import { supabase } from "@/integrations/supabase/client";
import type { DeliveryInsert } from "@/types/delivery";

export async function fetchDeliveries() {
  const { data, error } = await supabase
    .from("deliveries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchDelivery(id: string) {
  const { data, error } = await supabase.from("deliveries").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createDelivery(delivery: Omit<DeliveryInsert, "user_id">) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("deliveries")
    .insert({ ...delivery, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function generateToken(deliveryId: string, expiresInMinutes = 10) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

  await supabase
    .from("delivery_tokens")
    .update({ status: "expired" as const })
    .eq("delivery_id", deliveryId)
    .eq("status", "active" as const);

  const { data, error } = await supabase
    .from("delivery_tokens")
    .insert({ delivery_id: deliveryId, token, expires_at: expiresAt })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchActiveToken(deliveryId: string) {
  const { data, error } = await supabase
    .from("delivery_tokens")
    .select("*")
    .eq("delivery_id", deliveryId)
    .eq("status", "active" as const)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Validates a token client-side (used by the in-app Box Simulator).
// The ESP32 / real IoT device should call the `box-validate` Edge Function instead.
export async function validateToken(token: string) {
  const { data: tokenData, error: tokenError } = await supabase
    .from("delivery_tokens")
    .select("*, deliveries(*)")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !tokenData) {
    await logAccess(null, token, false, "Token not found");
    return { success: false, reason: "Token não encontrado" };
  }
  if (new Date(tokenData.expires_at) < new Date()) {
    await supabase.from("delivery_tokens").update({ status: "expired" as const }).eq("id", tokenData.id);
    await logAccess(tokenData.delivery_id, token, false, "Token expired");
    return { success: false, reason: "Token expirado" };
  }
  if (tokenData.status === "used") {
    await logAccess(tokenData.delivery_id, token, false, "Token already used");
    return { success: false, reason: "Token já utilizado" };
  }

  await supabase
    .from("delivery_tokens")
    .update({ status: "used" as const, used_at: new Date().toISOString() })
    .eq("id", tokenData.id);

  await supabase
    .from("deliveries")
    .update({ status: "delivered" as const, delivered_at: new Date().toISOString() })
    .eq("id", tokenData.delivery_id);

  await logAccess(tokenData.delivery_id, token, true, "Box opened successfully");
  return { success: true, reason: "Caixa aberta com sucesso!", delivery: tokenData.deliveries };
}

async function logAccess(deliveryId: string | null, token: string, success: boolean, reason: string) {
  await supabase.from("access_logs").insert({ delivery_id: deliveryId, token, success, reason });
}

export async function fetchAccessLogs(deliveryId?: string) {
  let query = supabase.from("access_logs").select("*").order("created_at", { ascending: false });
  if (deliveryId) query = query.eq("delivery_id", deliveryId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
