import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import LoadingScreen from "../LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ("admin" | "manager")[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = "/",
}) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!allowedRoles.includes(user.role as "admin" | "manager")) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
