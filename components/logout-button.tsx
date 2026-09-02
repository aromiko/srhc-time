import { logout } from "@/app/login/actions";
import { SubmitButton } from "@/components/submit-button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <SubmitButton
        pendingText="Logging out…"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        Log out
      </SubmitButton>
    </form>
  );
}
