import {
  apiClient,
  clearApiAuthToken,
  clearApiContext,
  getApiAuthToken,
  setApiAuthToken,
  setApiContext,
} from "@/lib/api";
import { useEffect, useState } from "react";

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
  fetchOptions?: {
    onSuccess?: () => void | Promise<void>;
  };
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

type MeResponse = {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
};

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getApiAuthToken();
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
    clearApiAuthToken();
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

      setApiAuthToken(response.accessToken);
      if (input.fetchOptions?.onSuccess) {
        await input.fetchOptions.onSuccess();
      }

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
  async email(input: SignUpInput): Promise<AuthResult<LoginResponse>> {
    try {
      const data = await apiClient.post<
        LoginResponse & { organizationId: string; branchId: number }
      >("/api/auth/register", {
        email: input.email,
        password: input.password,
        name: input.name,
        salonName: input.salonName,
        salonSlug: input.salonSlug,
        province: input.province,
        address: input.address,
        phone: input.phone,
      });

      setApiAuthToken(data.accessToken);
      setApiContext({ branchId: String(data.branchId) });
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
  clearApiAuthToken();
  clearApiContext();
}

export const organization = {
  async list(): Promise<{ data: Array<{ id: string; name: string; slug: string | null }> }> {
    const data = await apiClient.get<Array<{ id: string; name: string; slug: string | null }>>(
      "/organizations",
    );
    return { data };
  },
  async create(input: { name: string; slug: string }): Promise<AuthResult<{ id: string }>> {
    try {
      const data = await apiClient.post<{ id: string; name: string; slug: string | null; role: string }>(
        "/organizations",
        input,
      );
      setApiContext({ branchId: null });
      return { data: { id: data.id } };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Không thể tạo tổ chức",
        },
      };
    }
  },
  async setActive(): Promise<AuthResult<{ id: string }>> {
    try {
      const data = await apiClient.post<{ id: string; name: string; slug: string | null; role: string }>(
        "/organizations/active",
        {},
      );
      setApiContext({ branchId: null });
      return { data: { id: data.id } };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Không thể chọn tổ chức",
        },
      };
    }
  },
};

export function useSession(): UseSessionResult {
  const [state, setState] = useState<UseSessionResult>({
    data: null,
    isPending: true,
    error: null,
  });

  useEffect(() => {
    let disposed = false;

    async function load() {
      const token = getApiAuthToken();
      if (!token) {
        if (!disposed) {
          setState({ data: null, isPending: false, error: null });
        }
        return;
      }

      try {
        const user = await fetchCurrentUser();
        if (disposed) return;

        if (!user) {
          setState({ data: null, isPending: false, error: null });
          return;
        }

        setState({
          data: {
            user,
            session: {
              token,
            },
          },
          isPending: false,
          error: null,
        });
      } catch (error) {
        if (disposed) return;
        setState({
          data: null,
          isPending: false,
          error: error instanceof Error ? error : new Error("Không thể tải phiên đăng nhập"),
        });
      }
    }

    void load();

    const onStorage = (event: StorageEvent) => {
      if (event.key === "api.accessToken") {
        setState((previous) => ({ ...previous, isPending: true }));
        void load();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      disposed = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return state;
}
