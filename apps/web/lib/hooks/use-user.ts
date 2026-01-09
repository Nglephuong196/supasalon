"use client";

import { useEffect, useState } from "react";

// TODO: Replace with new backend auth

interface Profile {
  id: string;
  full_name: string | "";
  phone: string | "";
  avatar_url: string | "";
  is_admin: boolean;
}

interface User {
  id: string;
  email?: string;
}

interface UseUserReturn {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    // TODO: Implement with new backend
    console.warn('useUser: Not implemented - awaiting new backend');
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, profile, isLoading, refetch: fetchUser };
}
