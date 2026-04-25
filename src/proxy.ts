import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/api/admin(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  const { userId, redirectToSignIn, sessionClaims } = await auth();
  if (!userId) {
    // Clerk v7's auth.protect() throws notFound() instead of redirecting,
    // which is the wrong UX for our customer-facing app.
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (isAdminRoute(req)) {
    const role = (sessionClaims?.metadata as { role?: string } | undefined)
      ?.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
