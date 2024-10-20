import { useAuthStore } from "@/lib/auth";
import { BASE_URL, KEY_LS_USER } from "@/lib/constants";
import { useNavigate } from "@tanstack/react-router";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function Logout() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const logoutHandler = async () => {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    localStorage.removeItem(KEY_LS_USER);
    navigate({
      to: "/",
    });
  };

  return <DropdownMenuItem onClick={logoutHandler}>Log out</DropdownMenuItem>;
}
