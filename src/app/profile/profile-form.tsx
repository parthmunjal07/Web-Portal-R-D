"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ProfileFields } from "@/lib/profile-fields";

export type ProfileData = ProfileFields & {
  name: string;
  email: string;
  roleTitle: string;
};

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [fields, setFields] = useState<ProfileFields>({
    department: profile.department,
    institutionId: profile.institutionId,
    phoneNumber: profile.phoneNumber,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function change(key: keyof ProfileFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Could not save your profile.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="profile-name">Full name</label>
          <input id="profile-name" value={profile.name} disabled />
        </div>
        <div className="field">
          <label htmlFor="profile-role">Role</label>
          <input id="profile-role" value={profile.roleTitle} disabled />
        </div>
        <div className="field full">
          <label htmlFor="profile-email">Institutional email</label>
          <input id="profile-email" value={profile.email} disabled />
        </div>
        <div className="field">
          <label htmlFor="profile-department">Department</label>
          <input
            id="profile-department"
            value={fields.department}
            onChange={(event) => change("department", event.target.value)}
            maxLength={100}
            required
            disabled={loading}
          />
        </div>
        <div className="field">
          <label htmlFor="profile-institution-id">Institution ID</label>
          <input
            id="profile-institution-id"
            value={fields.institutionId}
            onChange={(event) => change("institutionId", event.target.value)}
            maxLength={40}
            required
            disabled={loading}
          />
        </div>
        <div className="field full">
          <label htmlFor="profile-phone">Phone number</label>
          <input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            value={fields.phoneNumber}
            onChange={(event) => change("phoneNumber", event.target.value)}
            maxLength={20}
            required
            disabled={loading}
          />
        </div>
      </div>
      {error && (
        <p className="delete-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="decision-made" role="status">
          Profile saved.
        </p>
      )}
      <div className="form-actions">
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
