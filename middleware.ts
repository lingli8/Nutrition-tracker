export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/food-log/:path*", "/analytics/:path*", "/community/:path*"],
}
