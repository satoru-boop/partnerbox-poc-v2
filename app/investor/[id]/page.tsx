// app/investor/[id]/page.tsx
import { redirect } from 'next/navigation';

// Next.js 16 では params が Promise になります
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/investors/${id}`);

}