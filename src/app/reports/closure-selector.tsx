"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClosureSelector({
  projects,
}: {
  projects: { id: string; name: string; code: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(projects[0]?.id || "");

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
      <select
        className="field"
        style={{ margin: 0, padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", flex: 1 }}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {projects.length === 0 && <option value="">No projects available</option>}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        className="primary"
        disabled={!selected}
        onClick={() => router.push(`/reports/closure/${selected}`)}
      >
        Generate
      </button>
    </div>
  );
}
