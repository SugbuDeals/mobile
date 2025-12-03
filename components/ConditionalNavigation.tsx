
import React from "react";
import { Redirect } from "expo-router";
import { useDualRole } from "@/hooks/useDualRole";

interface ConditionalNavigationProps {
  children: React.ReactNode;
}

export default function ConditionalNavigation({
  children,
}: ConditionalNavigationProps) {
  const { hasDualRole, activeRole } = useDualRole();

  if (hasDualRole && activeRole === "RETAILER") {
    return <Redirect href="/(retailers)" />;
  }

  return <>{children}</>;
}
