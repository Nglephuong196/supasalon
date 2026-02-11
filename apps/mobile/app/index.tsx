import { Redirect } from "expo-router";
import { useSession } from "../lib/auth-client";

export default function Index() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return null; // Or a loading spinner
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
