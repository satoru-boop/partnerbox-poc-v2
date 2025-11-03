// app/investor/[...slug]/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const id = Array.isArray(slug) && slug.length > 0 ? slug[0] : '';

  if (!id) redirect('/investor'); // idが無い時は一覧へ
  redirect(`/investors/${id}`);
}
