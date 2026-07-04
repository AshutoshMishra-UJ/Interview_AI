const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

if (!configuredApiBaseUrl && !import.meta.env.DEV) {
    console.warn(
        "VITE_API_BASE_URL is not set. Configure it in Vercel so the frontend can reach the deployed backend."
    )
}

export const API_BASE_URL = configuredApiBaseUrl || (import.meta.env.DEV ? "http://localhost:4000" : window.location.origin)