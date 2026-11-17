import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import { getApiErrorMessage } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await forgotPassword(email);
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
        <span className="eyebrow">Account recovery</span>
        <h2>Reset your password</h2>
        <p className="form-intro">Enter the email connected to your ShopEase account.</p>
        {error && <div className="form-alert" role="alert">{error}</div>}
        {message && <div className="form-success" role="status">{message}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required />
          </label>
          <button className="primary-button" type="submit" disabled={isSubmitting || Boolean(message)}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
