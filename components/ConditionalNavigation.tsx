
import React from "react";

interface ConditionalNavigationProps {
  children: React.ReactNode;
}

export default function ConditionalNavigation({
  children,
}: ConditionalNavigationProps) {
  return <>{children}</>;
}
