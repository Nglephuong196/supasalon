import { Redirect } from "expo-router";

// This is a placeholder screen for the center button
// The actual action is handled by the FAB in the layout
export default function CreateScreen() {
  // Redirect back to home if somehow navigated here
  return <Redirect href="/(app)/(tabs)" />;
}
