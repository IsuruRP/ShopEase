import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/client";
import { getProfile, updateProfile } from "../api/profile";
import { PageState } from "../components/PageState";
import { LoadingState } from "../components/LoadingState";

export function ProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!profileQuery.data) return;
    setFullName(profileQuery.data.fullName);
    setEmail(profileQuery.data.email);
    setPhone(profileQuery.data.phone);
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
      setSuccess("Your profile has been updated.");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");
    updateMutation.mutate({ fullName, email, phone });
  }

  if (profileQuery.isLoading) {
    return <div className="catalog-page"><LoadingState variant="profile" label="Loading customer profile" /></div>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="catalog-page">
        <PageState title="Profile unavailable" message={getApiErrorMessage(profileQuery.error)} actionLabel="Try again" onAction={() => void profileQuery.refetch()} />
      </div>
    );
  }

  const profile = profileQuery.data;
  const initial = (profile.fullName || profile.username).charAt(0).toUpperCase();

  return (
    <div className="catalog-page profile-page">
      <header className="page-header">
        <div><span className="eyebrow">Your account</span><h1>Customer profile.</h1><p>Keep your contact details ready for a faster checkout.</p></div>
      </header>

      <div className="profile-layout">
        <aside className="profile-summary">
          <div className="profile-avatar">{initial}</div>
          <h2>{profile.fullName || profile.username}</h2>
          <span>@{profile.username}</span>
          <b>{profile.role}</b>
          <div className="profile-stats">
            <Link to="/orders"><strong>{profile.orderCount}</strong><span>Orders</span></Link>
            <div><strong>{profile.addressCount}</strong><span>Addresses</span></div>
          </div>
          <p>Saved addresses can be selected or managed securely during checkout.</p>
        </aside>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div><span className="eyebrow">Personal details</span><h2>Contact information</h2></div>
            <span className="profile-username">Username: <strong>{profile.username}</strong></span>
          </div>
          {success && <div className="form-success" role="status">{success}</div>}
          {updateMutation.isError && <div className="form-alert" role="alert">{getApiErrorMessage(updateMutation.error)}</div>}
          <form className="profile-form" onSubmit={handleSubmit}>
            <label><span>Full name</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={100} autoComplete="name" required /></label>
            <label><span>Email address</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" maxLength={254} autoComplete="email" required /></label>
            <label><span>Phone number</span><input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" maxLength={30} autoComplete="tel" required /></label>
            <div className="profile-form-footer">
              <small>Your username and account role cannot be changed here.</small>
              <button className="primary-button" type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save profile"}</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
