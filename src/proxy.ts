import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/api/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    // Clerk v7's auth.protect() throws notFound() instead of redirecting.
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Role enforcement for /admin happens in src/lib/admin.ts requireAdmin()
  // because reading publicMetadata reliably needs currentUser(), which is
  // not available at the middleware/proxy layer.
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
