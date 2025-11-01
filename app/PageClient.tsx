"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Role = "founder" | "investor" | "ops"

const ROLES: { key: Role; label: string; href: string; desc: string }[] = [
  { key: "founder",  label: "起業家", href: "/founder",  desc: "PL/KPI入力とAI解析（PoC）" },
  { key: "investor", label: "投資家", href: "/investor", desc: "案件リストと詳細確認" },
  { key: "ops",      label: "運営",   href: "/ops",      desc: "運営向けメニュー（仮）" },
]

export default function PageClient() {
  const router = useRouter()
  const [selected, setSelected] = useState<Role | null>(null)

  useEffect(() => {
    const v = localStorage.getItem("pb-role") as Role | null
    if (v) setSelected(v)
  }, [])

  const choose = (r: Role) => {
    setSelected(r)
    localStorage.setItem("pb-role", r)
    const target = ROLES.find(x => x.key === r)?.href ?? "/"
    router.push(target)
  }

  const S = {
    wrap: { maxWidth: 980, margin: "40px auto", padding: "24px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
    h1:   { fontSize: 28, fontWeight: 800 as const, marginBottom: 24 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 },
    cardBase: {
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 20,
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,.04)",
      cursor: "pointer",
      transition: "all .15s ease",
    } as React.CSSProperties,
    cardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      borderColor: "#2563eb",
    } as React.CSSProperties,
    cardSel: {
      border: "1.5px solid #2563eb",
      background: "#f8fafc",
      boxShadow: "0 4px 12px rgba(37,99,235,.10)",
    } as React.CSSProperties,
    ttl:  { fontSize: 20, fontWeight: 800 as const, marginBottom: 10 },
    desc: { color: "#6b7280", fontSize: 13, marginBottom: 18 },
    btn:  {
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid #111827",
      background: "#111827",
      color: "#fff",
      fontSize: 14,
      cursor: "pointer",
      width: "100%",
    } as React.CSSProperties,
    note: { marginTop: 20, color: "#374151" },
    dot:  { width: 8, height: 8, borderRadius: 9999, background: "#10b981", display: "inline-block", marginRight: 6 },
  }

  return (
    <div style={S.wrap}>
      <h1 style={S.h1}>Partner Box — 役割を選択</h1>

      <div style={S.grid}>
        {ROLES.map((r) => {
          const active = selected === r.key
          return (
            <div
              key={r.key}
              style={{
                ...S.cardBase,
                ...(active ? S.cardSel : {}),
              }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, S.cardHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, active ? S.cardSel : S.cardBase)}
              onClick={() => choose(r.key)}
            >
              <div style={S.ttl}>{r.label}</div>
              <div style={S.desc}>{r.desc}</div>
              <button style={S.btn}>選ぶ</button>
            </div>
          )
        })}
      </div>

      <div style={S.note}>
        {selected ? (
          <>
            <span style={S.dot} /> 現在の選択: <strong>{selected}</strong>
          </>
        ) : (
          "まだ役割が選択されていません"
        )}
      </div>
    </div>
  )
}
