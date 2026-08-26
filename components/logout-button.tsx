import { logout } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        Log out
      </button>
    </form>
  );
}
