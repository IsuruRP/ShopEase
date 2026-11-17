import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { getApiErrorMessage } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "This reset link is missing its security token.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, password);
      setMessage(response.message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form-wrap">
        <span className="eyebrow">Secure reset</span>
        <h2>Choose a new password</h2>
        <p className="form-intro">Use at least 8 characters and avoid reusing an old password.</p>
        {error && <div className="form-alert" role="alert">{error}</div>}
        {message && <div className="form-success" role="status">{message}</div>}
        {!message && token && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label><span>New password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
            <label><span>Confirm new password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
            <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Resetting…" : "Reset password"}</button>
          </form>
        )}
        <p className="auth-switch"><Link to="/login">Return to sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
