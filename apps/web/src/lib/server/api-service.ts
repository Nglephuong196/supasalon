import { PUBLIC_API_URL } from '$env/static/public';
import { error as kitError } from '@sveltejs/kit';

interface FetchOptions<T = unknown> {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: T;
    headers?: Record<string, string>;
}

interface ApiError {
    error: string;
    message?: string;
}

/**
 * Centralized API service for server-side fetch calls.
 * Automatically handles organization headers and error responses.
 * 
 * @example
 * ```typescript
 * const api = new ApiService(organizationId, cookies);
 * const customers = await api.get<Customer[]>('/customers');
 * const newCustomer = await api.post<Customer>('/customers', { name: 'John' });
 * ```
 */
export class ApiService {
    private baseUrl: string;

    constructor(
        private organizationId: string | undefined,
        private cookies: string
    ) {
        this.baseUrl = PUBLIC_API_URL;
    }

    private getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
        const headers: Record<string, string> = {
            cookie: this.cookies,
            ...additionalHeaders,
        };

        if (this.organizationId) {
            headers['X-Organization-Id'] = this.organizationId;
        }

        return headers;
    }

    /**
     * Make a GET request to the API.
     */
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * Make a POST request to the API.
     */
    async post<T, B = unknown>(endpoint: string, body: B): Promise<T> {
        return this.request<T>(endpoint, { method: 'POST', body });
    }

    /**
     * Make a PUT request to the API.
     */
    async put<T, B = unknown>(endpoint: string, body: B): Promise<T> {
        return this.request<T>(endpoint, { method: 'PUT', body });
    }

    /**
     * Make a PATCH request to the API.
     */
    async patch<T, B = unknown>(endpoint: string, body: B): Promise<T> {
        return this.request<T>(endpoint, { method: 'PATCH', body });
    }

    /**
     * Make a DELETE request to the API.
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Core request method with automatic error handling.
     */
    private async request<T, B = unknown>(
        endpoint: string,
        options: FetchOptions<B> = {}
    ): Promise<T> {
        const { method = 'GET', body, headers: additionalHeaders } = options;

        const headers = this.getHeaders(additionalHeaders);

        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json().catch(() => ({
                error: 'Unknown error',
            }));

            // Re-throw as SvelteKit error for proper handling
            throw kitError(response.status, errorData.error || errorData.message || 'API request failed');
        }

        return response.json();
    }

    /**
     * Make a request and return the raw Response object.
     * Useful when you need to check status codes or handle errors manually.
     */
    async rawRequest<B = unknown>(
        endpoint: string,
        options: FetchOptions<B> = {}
    ): Promise<Response> {
        const { method = 'GET', body, headers: additionalHeaders } = options;

        const headers = this.getHeaders(additionalHeaders);

        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        return fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * Make multiple parallel requests.
     * Returns results in the same order as the endpoints array.
     */
    async parallel<T extends unknown[]>(
        requests: Array<{ endpoint: string; options?: FetchOptions }>
    ): Promise<T> {
        const promises = requests.map(({ endpoint, options }) =>
            this.request(endpoint, options)
        );
        return Promise.all(promises) as Promise<T>;
    }
}
