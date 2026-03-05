import { clearApiContext, setApiContext } from "@/lib/api";
import { useEffect } from "react";

function readBranchId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("branchId");
}

export function ApiContextSync() {
  useEffect(() => {
    setApiContext({ branchId: readBranchId() });

    const onStorage = (event: StorageEvent) => {
      if (event.key === "branchId") {
        setApiContext({ branchId: event.newValue });
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearApiContext();
    };
  }, []);

  return null;
}
