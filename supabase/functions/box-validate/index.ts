// Edge Function: box-validate
// Endpoint público chamado pelo ESP32 (caixa IoT) para validar um QR Code.
// Autenticação: header `x-box-api-key` deve bater com o secret BOX_API_KEY.
//
// Request:  POST /functions/v1/box-validate { token: string, box_id?: string }
// Response: { success: boolean, reason: string, delivery?: {...} }
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOW_HEADERS = "authorization, x-client-info, apikey, content-type, x-box-api-key";
const cors = { ...corsHeaders, "Access-Control-Allow-Headers": ALLOW_HEADERS };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // Shared-secret auth for ESP32
    const apiKey = req.headers.get("x-box-api-key");
    const expected = Deno.env.get("BOX_API_KEY");
    if (!expected || apiKey !== expected) {
      return json({ success: false, reason: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const token: string | undefined = body?.token;
    const boxId: string | undefined = body?.box_id;
    if (!token || typeof token !== "string") {
      return json({ success: false, reason: "Token ausente" }, 400);
    }

    // Service role bypasses RLS (function is the trust boundary)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tokenRow } = await supabase
      .from("delivery_tokens")
      .select("*, deliveries(*)")
      .eq("token", token)
      .maybeSingle();

    const ip = req.headers.get("x-forwarded-for") ?? boxId ?? null;

    if (!tokenRow) {
      await supabase.from("access_logs").insert({ token, success: false, reason: "Token não encontrado", ip_address: ip });
      return json({ success: false, reason: "Token não encontrado" }, 404);
    }
    if (new Date(tokenRow.expires_at) < new Date()) {
      await supabase.from("delivery_tokens").update({ status: "expired" }).eq("id", tokenRow.id);
      await supabase.from("access_logs").insert({ delivery_id: tokenRow.delivery_id, token, success: false, reason: "Token expirado", ip_address: ip });
      return json({ success: false, reason: "Token expirado" }, 410);
    }
    if (tokenRow.status === "used") {
      await supabase.from("access_logs").insert({ delivery_id: tokenRow.delivery_id, token, success: false, reason: "Token já utilizado", ip_address: ip });
      return json({ success: false, reason: "Token já utilizado" }, 409);
    }

    // Mark used + delivered
    await supabase.from("delivery_tokens").update({ status: "used", used_at: new Date().toISOString() }).eq("id", tokenRow.id);
    await supabase.from("deliveries").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", tokenRow.delivery_id);
    await supabase.from("access_logs").insert({ delivery_id: tokenRow.delivery_id, token, success: true, reason: "Caixa aberta", ip_address: ip });

    return json({ success: true, reason: "Caixa aberta com sucesso", delivery: tokenRow.deliveries });
  } catch (e) {
    return json({ success: false, reason: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
