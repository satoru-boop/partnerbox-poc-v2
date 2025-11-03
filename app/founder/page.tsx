// app/founder/page.tsx
import FormClient from './FormClient';   // ← 相対パスに直す
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Founder 登録（AI解析フォーム）</h1>
      <p className="text-sm text-gray-600">
        入力後に <b>AI解析</b> をクリックすると、AIがスコアと要約・KPIを生成します。内容を確認して <b>保存</b> すると投資家プレビュー（/investors/:id）へ遷移します。
      </p>
      <FormClient />
    </main>
  );
}
