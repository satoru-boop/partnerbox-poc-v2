"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Role = "founder" | "investor" | "ops"

const ROLES: { key: Role; label: string; href: string; desc: string }[] = [
  { key: "founder",  label: "起業家", href: "/founder",  desc: "PL/KPI入力とAI解析（PoC）" },
  { key: "investor", label: "投資家", href: "/investor", desc: "案件リストと詳細確認" },
  { key: "ops",      label: "運営",   href: "/ops",      desc: "運営向けメニュー（仮）" },
]

export default function PageClient() {
  const [selected, setSelected] = useState<Role | null>(null)

  useEffect(() => {
    const v = localStorage.getItem("pb-role") as Role | null
    if (v) setSelected(v)
  }, [])

  const onChoose = (r: Role) => {
    setSelected(r)
    localStorage.setItem("pb-role", r)
  }

  const S = {
    wrap: { maxWidth: 980, margin: "40px auto", padding: "24px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
    h1:   { fontSize: 24, fontWeight: 700, marginBottom: 24 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 },
    card: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.04)" },
    ttl:  { fontSize: 18, fontWeight: 700, marginBottom: 8 },
    desc: { color: "#6b7280", fontSize: 13, marginBottom: 16 },
    row:  { display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" },
    btn:  { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#111827", color: "#fff", fontSize: 14, cursor: "pointer" },
    link: { textDecoration: "none" as const },
    note: { marginTop: 18, color: "#374151" },
    dot:  { width: 8, height: 8, borderRadius: 9999, background: "#10b981", display: "inline-block", marginRight: 6 },
  }

  return (
    <div style={S.wrap}>
      <h1 style={S.h1}>Partner Box — 役割を選択</h1>

      <div style={S.grid}>
        {ROLES.map((r) => (
          <div key={r.key} style={S.card}>
            <div style={S.ttl}>{r.label}</div>
            <div style={S.desc}>{r.desc}</div>
            <div style={S.row}>
              <button style={S.btn} onClick={() => onChoose(r.key)}>選ぶ</button>
              <Link href={r.href} style={S.link}>▶ 画面へ</Link>
            </div>
          </div>
        ))}
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
