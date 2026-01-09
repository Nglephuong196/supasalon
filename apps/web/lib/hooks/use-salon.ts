"use client";

import { useEffect, useState } from "react";

// TODO: Replace with new backend

interface Salon {
  id: string;
  name: string;
  province: string;
  address: string;
  phone: string;
  logo_url: string | null;
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
    // TODO: Implement with new backend
    console.warn('useSalon: Not implemented - awaiting new backend');
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
