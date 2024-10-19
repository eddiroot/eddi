import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { useNavigate } from "@tanstack/react-router";

export function Logout() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const logoutHandler = async () => {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
    });
    setUser(null);
    navigate({
      to: "/",
    });
  };

  return <Button onClick={logoutHandler}>Logout</Button>;
}
