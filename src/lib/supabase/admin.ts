import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// تحذير: هذا العميل يستخدم مفتاح service_role الذي يتجاوز كل سياسات RLS.
// يجب ألا يُستدعى إلا من كود يعمل على الخادم فقط (API routes / Server
// Components) وألا يُصدَّر أو يُستخدم داخل أي مكوّن عميل (Client Component).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

