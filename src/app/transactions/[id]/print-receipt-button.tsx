"use client";
export function PrintReceiptButton() {
  return <button className="secondary" onClick={() => window.print()}>Print / save transaction receipt</button>;
}
