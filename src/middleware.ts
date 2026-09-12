import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { canAccessFinance, canEditCrm, canManageUsers } from "@/lib/rbac";

const ADMIN_ONLY_PREFIXES = ["/api/admin/integrations", "/api/admin/users"];
const FINANCE_PREFIXES = ["/api/admin/payments", "/api/admin/invoices", "/api/admin/expenses"];
const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthApi = pathname.startsWith("/api/admin/auth/");
  const isLoginPage = pathname === "/admin/login";

  if (isAuthApi || isLoginPage) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (pathname.startsWith("/api/admin/")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role;
    const isAdminOnly = ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

    if (isAdminOnly && !canManageUsers(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isAdminOnly && MUTATING_METHODS.includes(request.method)) {
      const isFinance = FINANCE_PREFIXES.some((p) => pathname.startsWith(p));
      const allowed = isFinance ? canAccessFinance(role) || canEditCrm(role) : canEditCrm(role);
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const headers = new Headers(request.headers);
    headers.set("x-user-id", String(session.uid));
    headers.set("x-user-role", session.role);
    headers.set("x-user-name", session.name);
    return NextResponse.next({ request: { headers } });
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
