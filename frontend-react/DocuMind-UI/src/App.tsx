import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
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