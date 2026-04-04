import { useState } from "react";
import { api } from "../services/api";

export default function Login({ onLogin, onSwitch }: any) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const data = await api.login(email, password);

    localStorage.setItem("token", data.token);
    onLogin(); // move to dashboard
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

      <button onClick={handleLogin}>Login</button>

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