export default function Profile() {
  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Profile</h1>
          <div className="eyebrow">Account and session security</div>
        </div>
      </div>
      <div className="panel" style={{ maxWidth: 700 }}>
        <div className="form-grid">
          <div className="field">
            <label>Full name</label>
            <input defaultValue="Dr. Arvind Kumar" />
          </div>
          <div className="field">
            <label>Role</label>
            <input defaultValue="Project Inspector" disabled />
          </div>
          <div className="field full">
            <label>Institutional email</label>
            <input defaultValue="inspector@demo.edu" />
          </div>
        </div>
        <div className="form-actions">
          <button className="primary">Save profile</button>
        </div>
        <hr
          style={{
            border: 0,
            borderTop: "1px solid #e5e7eb",
            margin: "28px 0",
          }}
        />
        <h2>Sessions</h2>
        <p className="sub">
          Your current session is protected by a secure httpOnly cookie.
        </p>
        <button className="secondary" style={{ marginTop: 12 }}>
          Log out of all sessions
        </button>
      </div>
    </main>
  );
}
