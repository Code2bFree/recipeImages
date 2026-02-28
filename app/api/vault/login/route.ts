import { NextResponse } from "next/server";

const VAULT_COOKIE = "vault_access";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { password?: string }
    | null;

  const password = body?.password ?? "";
  const expected = process.env.VAULT_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured: VAULT_PASSWORD missing." },
      { status: 500 },
    );
  }

  if (password !== expected) {
    return NextResponse.json(
      { ok: false, error: "Wrong password." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: VAULT_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
