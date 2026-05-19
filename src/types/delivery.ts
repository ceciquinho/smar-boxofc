import type { Database } from "@/integrations/supabase/types";

export type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];
export type TokenStatus = Database["public"]["Enums"]["token_status"];

export type Delivery = Database["public"]["Tables"]["deliveries"]["Row"];
export type DeliveryInsert = Database["public"]["Tables"]["deliveries"]["Insert"];

export type DeliveryToken = Database["public"]["Tables"]["delivery_tokens"]["Row"];
export type AccessLog = Database["public"]["Tables"]["access_logs"]["Row"];
