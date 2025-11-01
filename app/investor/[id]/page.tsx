// /app/investor/[id]/page.tsx
import { redirect } from 'next/navigation';

export default function InvestorDetailRedirect({ params }: any) {
  redirect(`/investors/${params.id}`);
}
