import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ username, email, password, first_name: firstName, last_name: lastName });
      await login(username, password);
      navigate("/my-orders");
    } catch {
      setError("Could not create your account. The username or email may already be taken.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Create an account</h2>
      <label>
        First name
        <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </label>
      <label>
        Last name
        <input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </label>
      <label>
        Email
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Username
        <input required value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </button>
      <p className="hint">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
