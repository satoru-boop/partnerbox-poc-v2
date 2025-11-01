'use client'
import Link from 'next/link'

export default function Page() {
  const Card = ({
    href, title, desc,
  }: { href: string; title: string; desc: string }) => (
    <Link
      href={href}
      className="block rounded-xl border p-6 hover:shadow transition"
    >
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm opacity-70 mt-1">{desc}</div>
    </Link>
  )

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Partner Box — 役割を選択</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card href="/founder" title="起業家" desc="PL/KPI 入力とAI解析（PoC）" />
        <Card href="/investor" title="投資家" desc="案件リストと詳細確認" />
        <Card href="/ops" title="運営" desc="運営向けメニュー（仮）" />
      </div>
    </main>
  )
}
