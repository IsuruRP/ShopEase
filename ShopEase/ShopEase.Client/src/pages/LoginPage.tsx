import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const authenticatedSession = await login({ username, password });
      const destination =
        (location.state as { from?: string } | null)?.from ??
        (authenticatedSession.role === "Admin" ? "/admin" : "/products");
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form-wrap">
        <span className="eyebrow">Welcome back</span>
        <h2>Sign in to ShopEase</h2>
        <p className="form-intro">Pick up where you left off.</p>

        {error && <div className="form-alert" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              minLength={3}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="auth-switch">
          New to ShopEase? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
