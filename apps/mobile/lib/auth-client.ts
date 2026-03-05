import { useCallback, useEffect, useState } from "react";
import {
  apiClient,
  clearApiAuthToken,
  clearApiContext,
  getApiAuthToken,
  setApiAuthToken,
  setApiContext,
} from "./api";

type AuthError = {
  message: string;
};

type AuthResult<T = unknown> = {
  data?: T;
  error?: AuthError;
};

type AuthUser = {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
};

type SessionData = {
  user: AuthUser;
  session: {
    token: string;
  };
};

type UseSessionResult = {
  data: SessionData | null;
  isPending: boolean;
  error: Error | null;
};

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  email: string;
  password: string;
  name: string;
  salonName: string;
  salonSlug: string;
  province: string;
  address: string;
  phone: string;
};

type LoginResponse = {
  accessToken: string;
  expiresAtUtc: string;
};

type RegisterResponse = LoginResponse & {
  organizationId: string;
  branchId: number;
};

type MeResponse = {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
};

const listeners = new Set<() => void>();

function notifySessionChanged() {
  for (const listener of listeners) listener();
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = await getApiAuthToken();
  if (!token) return null;

  try {
    const me = await apiClient.get<MeResponse>("/api/auth/me");
    return {
      id: me.id,
      email: me.email,
      name: me.name,
      image: me.image,
    };
  } catch {
    await clearApiAuthToken();
    return null;
  }
}

export const signIn = {
  async email(input: SignInInput): Promise<AuthResult<LoginResponse>> {
    try {
      const response = await apiClient.post<LoginResponse>("/api/auth/login", {
        email: input.email,
        password: input.password,
      });

      await setApiAuthToken(response.accessToken);
      notifySessionChanged();
      return { data: response };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Đăng nhập thất bại",
        },
      };
    }
  },
};

export const signUp = {
  async email(input: SignUpInput): Promise<AuthResult<RegisterResponse>> {
    try {
      const data = await apiClient.post<RegisterResponse>("/api/auth/register", {
        email: input.email,
        password: input.password,
        name: input.name,
        salonName: input.salonName,
        salonSlug: input.salonSlug,
        province: input.province,
        address: input.address,
        phone: input.phone,
      });

      await setApiAuthToken(data.accessToken);
      await setApiContext({ branchId: String(data.branchId) });
      notifySessionChanged();
      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Đăng ký thất bại",
        },
      };
    }
  },
};

export async function signOut(): Promise<void> {
  await clearApiAuthToken();
  await clearApiContext();
  notifySessionChanged();
}

export function useSession(): UseSessionResult {
  const [state, setState] = useState<UseSessionResult>({
    data: null,
    isPending: true,
    error: null,
  });

  const load = useCallback(async () => {
    const token = await getApiAuthToken();
    if (!token) {
      setState({ data: null, isPending: false, error: null });
      return;
    }

    try {
      const user = await fetchCurrentUser();
      if (!user) {
        setState({ data: null, isPending: false, error: null });
        return;
      }

      setState({
        data: {
          user,
          session: { token },
        },
        isPending: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        isPending: false,
        error: error instanceof Error ? error : new Error("Không thể tải phiên đăng nhập"),
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      setState((prev) => ({ ...prev, isPending: true }));
      await load();
    };

    void run();
    listeners.add(run);

    return () => {
      mounted = false;
      listeners.delete(run);
    };
  }, [load]);

  return state;
}
