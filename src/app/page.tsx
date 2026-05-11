import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: engineers, error } = await supabase
    .from("engineers")
    .select("code, full_name, role")
    .order("code");

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Error</h1>
        <pre>{error.message}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>AROET — Engineers</h1>
      <p>Connected to Supabase ✓</p>
      <ul>
        {engineers?.map((e) => (
          <li key={e.code}>
            <strong>{e.code}</strong> — {e.full_name} ({e.role})
          </li>
        ))}
      </ul>
    </div>
  );
}