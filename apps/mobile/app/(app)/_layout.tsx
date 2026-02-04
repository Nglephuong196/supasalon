import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

// Create a client with mobile-optimized settings
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Refetch on window focus - great for tab navigation
            refetchOnWindowFocus: true,
            // Keep data fresh for 30 seconds
            staleTime: 30 * 1000,
            // Cache data for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
        },
    },
});

export default function AppLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
            </Stack>
        </QueryClientProvider>
    );
}
