import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { BASE_URL, KEY_LS_USER } from "@/lib/constants";
import { User } from "@/lib/types";

export type LoginType = {
  username: string;
  password: string;
};

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    const isLoggedIn = useAuthStore.getState().user;
    if (isLoggedIn) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginType>();

  const onSubmit = async (data: LoginType) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (response.ok) {
        const user = (await response.json()) as User | null;
        setUser(user);
        localStorage.setItem(KEY_LS_USER, JSON.stringify(user));
        navigate({
          to: "/dashboard",
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>
          Enter your username and password to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p className="text-red-600">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="text-red-600">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
