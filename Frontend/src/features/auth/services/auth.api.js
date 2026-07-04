import axios from "axios"
import { API_BASE_URL } from "../../../config/apiBaseUrl"

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function register({ username, email, password }) {
    const res = await api.post('/api/auth/register', { username, email, password })
    return res.data
}

export async function login({ email, password }) {
    const res = await api.post("/api/auth/login", { email, password })
    return res.data
}

export async function logout() {
    const res = await api.get("/api/auth/logout")
    return res.data
}

export async function getMe() {
    const res = await api.get("/api/auth/get-me")
    return res.data
}