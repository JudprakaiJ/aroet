import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/current-user";
import { listLoginEngineers } from "./actions";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const me = await currentUser();
  if (me) redirect("/");
  const engineers = await listLoginEngineers();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg)",
      }}
    >
      <LoginForm engineers={engineers} />
    </div>
  );
}
