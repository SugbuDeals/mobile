
interface ConditionalNavigationProps {
  children: React.ReactNode;
}

export default function ConditionalNavigation({ children }: ConditionalNavigationProps) {
  // Temporarily bypass authentication for UI development
  return <>{children}</>;
  
  // Original authentication logic (commented out for UI development)
  /*
  const { user, accessToken } = useAppSelector((state) => state.auth);

  // If user is an admin, redirect to admin dashboard
  if (accessToken && (user?.user_type === 'admin' || user?.role === 'ADMIN')) {
    return <Redirect href="/(admin)" />;
  }

  // If user is a retailer and hasn't completed setup, redirect to setup page
  if (accessToken && user?.user_type === 'retailer' && !user?.retailer_setup_completed) {
    return <Redirect href="/(retailers)/setup" />;
  }

  // If user is a retailer and setup is complete, redirect to retailer dashboard
  if (accessToken && user?.user_type === 'retailer' && user?.retailer_setup_completed) {
    return <Redirect href="/(retailers)" />;
  }

  // If user is authenticated and is a consumer, show the children
  if (accessToken && user?.user_type === 'consumer') {
    return <>{children}</>;
  }

  // If not authenticated, redirect to login
  return <Redirect href="/auth/login" />;
  */
}
