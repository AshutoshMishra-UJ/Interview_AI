import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import MockInterview from "./features/interview/pages/MockInterview";
import Dashboard from "./features/interview/pages/Dashboard";
import SharedReport from "./features/interview/pages/SharedReport";
import Leaderboard from "./features/interview/pages/Leaderboard";

export const router = createBrowserRouter([
    { path: "/login",    element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/",         element: <Protected><Home /></Protected> },
    { path: "/interview/:interviewId",       element: <Protected><Interview /></Protected> },
    { path: "/interview/:interviewId/mock",  element: <Protected><MockInterview /></Protected> },
    { path: "/dashboard",                    element: <Protected><Dashboard /></Protected> },
    { path: "/leaderboard",                  element: <Leaderboard /> },
    { path: "/share/:token",                 element: <SharedReport /> }
])