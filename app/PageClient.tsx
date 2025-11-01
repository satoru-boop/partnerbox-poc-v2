"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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

  const choose = (r: Role, go = false) => {
    setSelected(r)
    localStorage.setItem("pb-role", r)
    if (go) {
      const target = ROLES.find(x => x.key === r)?.href ?? "/"
      router.push(target)
    }
  }

  // カードをキーボードでもフォーカス・Enter/Spaceで発火
  const keyGo = (r: Role) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      choose(r, true)
    }
  }

  const S = {
    wrap: { maxWidth: 980, margin: "40px auto", padding: "24px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
    h1:   { fontSize: 28, fontWeight: 800 as const, marginBottom: 24 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 },
    cardBase: {
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 20,
      background: "#fff",
      boxShadow: "0 1px 2px rgba(0,0,0,.04)",
      outline: "none",
      cursor: "pointer",
      transition: "border-color .15s ease, box-shadow .15s ease, background .15s ease",
    } as React.CSSProperties,
    cardSel: {
      border: "1.5px solid #2563eb",
      background: "#f8fafc",
      boxShadow: "0 4px 12px rgba(37,99,235,.10)",
    } as React.CSSProperties,
    ttl:  { fontSize: 20, fontWeight: 800 as const, marginBottom: 10 },
    desc: { color: "#6b7280", fontSize: 13, marginBottom: 14 },
    row:  { display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" },
    btn:  {
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid #111827",
      background: "#111827",
      color: "#fff",
      fontSize: 14,
      cursor: "pointer",
    } as React.CSSProperties,
    link: { textDecoration: "none", color: "#111827", fontWeight: 600 } as React.CSSProperties,
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
              tabIndex={0}
              aria-label={`${r.label}を選択`}
              onClick={() => choose(r.key, true)}         // カード全体クリックで選択→遷移
              onKeyDown={keyGo(r.key)}                    // Enter/Spaceでも同様
              style={{ ...S.cardBase, ...(active ? S.cardSel : {}) }}
            >
              <div style={S.ttl}>{r.label}</div>
              <div style={S.desc}>{r.desc}</div>

              <div style={S.row}>
                <button
                  type="button"
                  style={S.btn}
                  onClick={(e) => { e.stopPropagation(); choose(r.key, true) }}  // ボタンクリックも選択→遷移
                >
                  選ぶ
                </button>

                <Link
                  href={r.href}
                  style={S.link}
                  onClick={(e) => { e.stopPropagation(); localStorage.setItem("pb-role", r.key) }}
                >
                  ▶ 画面へ
                </Link>
              </div>
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
