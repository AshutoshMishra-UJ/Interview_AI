import { useContext } from "react";
import { AuthContext } from "../auth.context.store";
import { login, register, logout } from "../services/auth.api";

export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, message: "Invalid credentials." }
        } catch (err) {
            return { success: false, message: err?.response?.data?.message || err?.message || "An error occurred." }
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            if (data && data.user) {
                setUser(data.user)
                return { success: true }
            }
            return { success: false, message: "Registration failed or user exists." }
        } catch (err) {
            return { success: false, message: err?.response?.data?.message || err?.message || "An error occurred." }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            return { success: true }
        } catch (err) {
            return { success: false, message: err?.response?.data?.message || err?.message || "Logout failed." }
        } finally {
            setUser(null)
            setLoading(false)
        }
    }

    return { user, loading, handleRegister, handleLogin, handleLogout }
}