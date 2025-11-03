// app/investor/[id]/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 念のためIDが無いときは一覧へ
  if (!id) redirect('/investor');
  redirect(`/investors/${id}`);
}
