'use client';
import FounderForm from './FounderForm';  // ← ここを ./FounderForm に

export default function Page() {
  return <FounderForm />;
}

async function saveToSupabase(payload: any) {
  try {
    const res = await fetch('/api/founder_pl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'failed to save')
    alert(`登録しました！（ID: ${json.id}）`)
  } catch (err: any) {
    console.error(err)
    alert(`保存に失敗しました: ${err.message}`)
  }
}
