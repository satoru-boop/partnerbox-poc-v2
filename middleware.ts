// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = new URL(req.url);

  // /investor/xxxxx に来たら /investors/xxxxx へ 308 でリダイレクト
  if (url.pathname.startsWith('/investor/')) {
    const id = url.pathname.split('/').filter(Boolean).pop();
    if (id) {
      const dest = new URL(`/investors/${id}`, req.url);
      return NextResponse.redirect(dest, 308);
    }
    // /investor 直打ちなどは一覧へ
    return NextResponse.redirect(new URL('/investor', req.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/investor/:path*'],
};
