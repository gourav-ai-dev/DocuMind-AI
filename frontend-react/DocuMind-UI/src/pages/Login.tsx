import { useState } from "react";
import { api } from "../services/api";
import { setAuth } from "../utils/auth";

export default function Login({ onLogin, onSwitch }: any) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Email and password are required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true)
    try {
      const data = await api.login(trimmedEmail, trimmedPassword);
      setAuth(data.userId)
      onLogin();
    } catch (err) {
      setError("Login failed. Please check your email and password.");
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        <p className="auth-switch" onClick={onSwitch}>
          Don’t have an account? Register
        </p>
      </div>

      <div>
        <p
          className="auth-switch"
          style={{ fontSize: "12px" }}
          onClick={() => alert("Coming soon")}
        >
          Forgot Password?
        </p>
      </div>

    </div>
  );
}