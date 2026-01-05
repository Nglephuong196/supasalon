"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Salon {
  id: string;
  name: string;
  province: string;
  address: string;
  phone: string;
  logo_url: string | null;
}

interface SalonMember {
  salon_id: string;
  role: 'owner' | 'manager' | 'employee';
  salon: Salon;
}

interface UseSalonReturn {
  salon: Salon | null;
  salonId: string | null;
  role: 'owner' | 'manager' | 'employee' | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useSalon(): UseSalonReturn {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [role, setRole] = useState<'owner' | 'manager' | 'employee' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalon = async () => {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Get user's salon membership
    const { data: membership } = await supabase
      .from("salon_members")
      .select(`
        salon_id,
        role,
        salon:salons(*)
      `)
      .eq("user_id", user.id)
      .single();

    if (membership) {
      const salonData = Array.isArray(membership.salon) 
        ? membership.salon[0] 
        : membership.salon;
      setSalon(salonData as Salon);
      setRole(membership.role);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchSalon();
  }, []);

  return { 
    salon, 
    salonId: salon?.id || null,
    role, 
    isLoading, 
    refetch: fetchSalon 
  };
}
