import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "@/pages/Login"
import { HomePage } from "@/pages/Home"
import { ProfilePage } from "@/pages/Profile"
import { ChatPlaceholderPage } from "@/pages/ChatPlaceholder"
import { RequireAuth } from "@/lib/auth"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <RequireAuth>
              <ChatPlaceholderPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
