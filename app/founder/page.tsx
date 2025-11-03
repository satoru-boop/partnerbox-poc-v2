import FormClient from './FormClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Founder 登録（AI解析フォーム）</h1>
      <p className="text-sm text-gray-600">
        入力後に <b>AI解析</b> をクリックすると、AIがスコアと要約・KPIを生成します。内容を確認して
        <b>公開申請</b> すると、投資家プレビュー（/investors/:id）へ進みます。
      </p>
      <FormClient />
    </main>
  );
}
