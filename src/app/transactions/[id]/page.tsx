import { money } from "@/lib/domain";
import { Status } from "../../ui";
export default async function TransactionDetail() {
  return (
    <main className="content">
      <div className="page-header">
        <div>
          <h1 className="title">Transaction TXN-1842</h1>
          <div className="eyebrow">
            Project:{" "}
            <span style={{ color: "#005a85", fontWeight: 500 }}>
              AI-Based Crop Disease Detection
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="metric" style={{ fontSize: 24 }}>
            {money(42500)}
          </div>
          <Status status="Pending Dean Review" />
        </div>
      </div>
      <div className="detail-grid">
        <div style={{ display: "grid", gap: 24 }}>
          <div className="panel">
            <h2>Transaction details</h2>
            <div className="stat-grid">
              <div className="stat">
                <span>Date</span>
                <strong style={{ fontSize: 15 }}>28 Aug 2026</strong>
              </div>
              <div className="stat">
                <span>Vendor</span>
                <strong style={{ fontSize: 15 }}>
                  TechNova Equipments Ltd.
                </strong>
              </div>
              <div className="stat">
                <span>Category</span>
                <strong style={{ fontSize: 15 }}>Equipment</strong>
              </div>
            </div>
            <p style={{ marginTop: 22, color: "#40484f" }}>
              GPU servers for model training and image processing workloads.
            </p>
          </div>
          <div className="panel">
            <h2>Budget impact</h2>
            <div className="stat-grid">
              <div className="stat">
                <span>Category allocation</span>
                <strong>{money(700000)}</strong>
              </div>
              <div className="stat">
                <span>After this transaction</span>
                <strong>{money(392500)}</strong>
              </div>
              <div className="stat">
                <span>Remaining</span>
                <strong style={{ color: "#059669" }}>{money(307500)}</strong>
              </div>
            </div>
            <div className="progress" style={{ marginTop: 24, height: 12 }}>
              <i style={{ width: "56%" }} />
            </div>
          </div>
        </div>
        <aside style={{ display: "grid", gap: 24 }}>
          <div className="panel">
            <h2>Invoice preview</h2>
            <div className="invoice-preview">
              <div className="invoice-sheet">
                <strong>TechNova Equipments Ltd.</strong>
                <span className="sub">Invoice #TN-1842</span>
                <hr />
                <div className="progress" />
                <div
                  className="progress"
                  style={{ marginTop: 8, width: "65%" }}
                />
              </div>
            </div>
            <button
              className="secondary"
              style={{ width: "100%", marginTop: 12 }}
            >
              ↓ Download invoice
            </button>
          </div>
          <div className="panel">
            <h2>Approval history</h2>
            <div className="timeline">
              <div className="timeline-item">
                <small>28 Aug 2026, 10:45 AM</small>
                <strong>Transaction initiated</strong>
                <span className="sub">By Dr. Arvind Kumar (PI)</span>
              </div>
              <div className="timeline-item">
                <small>Current step</small>
                <strong>Pending Dean review</strong>
                <span className="sub">Awaiting your action</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
