// /app/investor/[id]/page.tsx
import { redirect } from 'next/navigation';

export default function InvestorDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/investors/${params.id}`);
}
