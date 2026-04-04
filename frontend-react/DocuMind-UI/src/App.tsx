import { useState } from "react";
import Login from "./pages/login";
import Register from "./pages/register";
import MainLayout from "./layout/MainLayout";

export default function App() {
  const [page, setPage] = useState<"login" | "register" | "app">("login");

  if (page === "login") {
    return (
      <Login
        onLogin={() => setPage("app")}
        onSwitch={() => setPage("register")}
      />
    );
  }

  if (page === "register") {
    return (
      <Register
        onSwitch={() => setPage("login")}
      />
    );
  }

  return <MainLayout />;
}