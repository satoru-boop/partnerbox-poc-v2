'use client';
import FormClient from './FormClient';

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Founder 登録（AI解析フォーム）</h1>
      <p className="text-sm text-gray-600">
        入力後に <strong>AI解析</strong> をクリックすると、AIがスコアと要約を生成します。
        内容を確認して<strong>保存</strong>すると、投資家プレビュー（/investors/:id）へ遷移します。
      </p>
      <FormClient />
    </main>
  );
}
