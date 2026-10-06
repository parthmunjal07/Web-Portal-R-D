import { notFound } from "next/navigation";
import { TransactionStatus as PrismaStatus } from "@prisma/client";
import { demoProjects, money } from "@/lib/domain";
import { db } from "@/lib/db";
import { FileText, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "./print-button";

// ── Normalised shape ──────────────────────────────────────────────────────────
type CategoryRow = { name: string; allocated: number; spent: number };
type PrintData = {
  id: string;
  code: string;
  name: string;
  pi: string;
  budget: number;
  spent: number;
  funders: string[];
  categories: CategoryRow[];
  transactions: {
    code: string;
    date: string;
    vendor: string;
    amount: number;
    category: string;
  }[];
};

// ── Data source ───────────────────────────────────────────────────────────────
async function getPrintData(id: string): Promise<PrintData> {
  // Demo mode
  if (process.env.DEMO_MODE === "true") {
    const p = demoProjects.find((x) => x.id === id) ?? demoProjects[0];
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      pi: "Dr. Arvind Kumar",
      budget: p.budget,
      spent: p.spent,
      funders: ["DST-SERB"],
      categories: [
        { name: "Equipment", allocated: 700000, spent: 350000 },
        { name: "Travel", allocated: 300000, spent: 120000 },
        { name: "Research Personnel", allocated: 500000, spent: 205000 },
      ],
      transactions: [
        {
          code: "TX-4088",
          date: "Oct 22, 2023",
          vendor: "Global Chemicals Inc.",
          amount: 12500,
          category: "Equipment",
        },
        {
          code: "TX-4085",
          date: "Oct 18, 2023",
          vendor: "Dr. A. Kumar",
          amount: 45000,
          category: "Travel",
        },
      ],
    };
  }

  // Real DB
  const row = await db.project.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      funders: { include: { organization: { select: { name: true } } } },
      categories: {
        include: {
          lines: {
            select: { amount: true },
            where: {
              transaction: {
                status: { in: [PrismaStatus.APPROVED, PrismaStatus.APPROVED_BY_DEAN] },
              },
            },
          },
        },
      },
      transactions: {
        where: {
          status: { in: [PrismaStatus.APPROVED, PrismaStatus.APPROVED_BY_DEAN] },
        },
        include: {
          lines: { include: { category: { select: { name: true } } } },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!row) notFound();

  const categories: CategoryRow[] = row.categories.map((c) => ({
    name: c.name,
    allocated: Number(c.allocated),
    spent: c.lines.reduce((sum, l) => sum + Number(l.amount), 0),
  }));
  
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    pi: row.owner.name,
    budget: Number(row.totalBudget),
    spent: categories.reduce((sum, c) => sum + c.spent, 0),
    funders: row.funders.map((f) => f.organization.name),
    categories,
    transactions: row.transactions.map((t) => ({
      code: t.code,
      date: t.date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      vendor: t.vendor,
      amount: t.lines.reduce((sum, l) => sum + Number(l.amount), 0),
      category: t.lines[0]?.category.name || "—",
    })),
  };
}



// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ClosureDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPrintData(id);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      {/* Non-printable header actions */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .content { padding: 0; box-shadow: none; }
        }
      `}</style>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
        <Link href="/reports" className="link" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Reports
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <PrintButton />
        </div>
      </div>

      <div style={{ background: 'white', padding: '40px 50px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: 'black' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 30 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Project Closure Summary</h1>
            <p style={{ margin: '6px 0 0', color: '#555' }}>Generated on {new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <FileText size={40} color="#000" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 40 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#666' }}>Project Code & Name</strong>
              <div style={{ fontSize: 16 }}>{data.code} — {data.name}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#666' }}>Principal Investigator</strong>
              <div style={{ fontSize: 16 }}>{data.pi}</div>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#666' }}>Funding Agency</strong>
              <div style={{ fontSize: 16 }}>{data.funders.join(", ") || "—"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: '#666' }}>Financial Summary</strong>
              <div style={{ fontSize: 16 }}>
                Budget: {money(data.budget)} <br/>
                Spent: {money(data.spent)} <br/>
                Remaining: {money(data.budget - data.spent)}
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 20 }}>Category Breakdown</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40, fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
              <th style={{ padding: '8px 4px' }}>Category</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Allocated</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Spent</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 4px' }}>{c.name}</td>
                <td style={{ padding: '12px 4px', textAlign: 'right' }}>{money(c.allocated)}</td>
                <td style={{ padding: '12px 4px', textAlign: 'right' }}>{money(c.spent)}</td>
                <td style={{ padding: '12px 4px', textAlign: 'right' }}>{money(c.allocated - c.spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={{ fontSize: 18, borderBottom: '1px solid #eee', paddingBottom: 10, marginBottom: 20 }}>Approved Transactions</h2>
        {data.transactions.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No approved transactions found for this project.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px' }}>Code</th>
                <th style={{ padding: '8px 4px' }}>Date</th>
                <th style={{ padding: '8px 4px' }}>Vendor</th>
                <th style={{ padding: '8px 4px' }}>Category</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 4px' }}>{t.code}</td>
                  <td style={{ padding: '8px 4px' }}>{t.date}</td>
                  <td style={{ padding: '8px 4px' }}>{t.vendor}</td>
                  <td style={{ padding: '8px 4px' }}>{t.category}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>{money(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 80, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 250, borderTop: '1px solid #000', paddingTop: 10, textAlign: 'center', fontSize: 12 }}>
            Signature of Principal Investigator
          </div>
          <div style={{ width: 250, borderTop: '1px solid #000', paddingTop: 10, textAlign: 'center', fontSize: 12 }}>
            Signature of Dean (R&D)
          </div>
        </div>
      </div>
    </div>
  );
}
