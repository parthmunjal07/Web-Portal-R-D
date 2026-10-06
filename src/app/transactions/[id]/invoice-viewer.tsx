"use client";

import { useState } from "react";

export function InvoiceViewer({
  url,
  fileName,
  vendor,
}: {
  url: string | null;
  fileName: string;
  vendor: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {isOpen && url ? (
        <div
          style={{
            height: "calc(100vh - 200px)",
            minHeight: 600,
            border: "1px solid #d7e2ec",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 12,
            background: "#fff",
          }}
        >
          <iframe
            src={url}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="Invoice PDF"
          />
        </div>
      ) : (
        <div className="invoice-preview">
          <div className="invoice-sheet">
            <strong>{vendor}</strong>
            <span className="sub">{fileName}</span>
            <hr />
            <div className="progress" />
            <div
              className="progress"
              style={{ marginTop: 8, width: "65%" }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {url ? (
          <>
            <button
              className="primary"
              style={{ flex: 1, padding: "8px 16px" }}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? "Close preview" : "View inline"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary"
              style={{
                padding: "8px 16px",
                display: "grid",
                placeItems: "center",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
              title="Download PDF"
            >
              ↓
            </a>
          </>
        ) : (
          <button
            className="secondary"
            style={{ width: "100%" }}
            disabled
            title="Invoice storage not configured"
          >
            ↓ {fileName}
          </button>
        )}
      </div>
    </div>
  );
}
