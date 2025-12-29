"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string | "";
  phone: string | "";
  avatar_url: string | "";
  is_admin: boolean;
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
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profile);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, profile, isLoading, refetch: fetchUser };
}
