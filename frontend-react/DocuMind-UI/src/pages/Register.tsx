import { useState } from "react";
import { api } from "../services/api";

export default function Register({ onSwitch }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    await api.register(email, password);
    alert("Registered! Please login.");
    onSwitch();
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleRegister}>Register</button>

      <p className="auth-switch" onClick={onSwitch}>
        Already have an account? Login
      </p>
    </div>
  );
}