import { requireUser } from "@/lib/auth";
import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

/* The recovery email link routes through /auth/callback, which exchanges
   the code for a temporary session and redirects here. requireUser() then
   gates the page — anyone who arrives without a valid recovery session
   gets bounced to /login by the helper. */
export default async function ResetPasswordPage() {
  await requireUser();
  return <ResetPasswordForm />;
}
