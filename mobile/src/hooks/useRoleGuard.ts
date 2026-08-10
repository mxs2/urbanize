import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { DemandRole } from "@/types/user";

const defaultRouteForRole = (role: DemandRole) => (role === "gestor" ? "/gestor" : "/dashboard");

/**
 * Mirrors the web app's RoleProtectedRoute: redirects to /login when signed out,
 * or to the caller's own home screen when the signed-in role isn't allowed here.
 */
export function useRoleGuard(allowedRoles: DemandRole[]) {
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(defaultRouteForRole(user.role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user]);

  const ready = hydrated && !!user && allowedRoles.includes(user.role);
  return { ready, user };
}
