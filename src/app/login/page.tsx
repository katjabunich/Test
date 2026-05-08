import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getUser();
  if (user) redirect("/");

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";

  return <LoginForm next={next} />;
}
