import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        
        // Protect these routes: must have a token
        if (path.startsWith('/dashboard') || path.startsWith('/createCourse')) {
          return !!token;
        }
        
        // Allow all other routes (like /, /sign-in, /sign-up, /api/*)
        return true;
      },
    },
    pages: {
      signIn: "/sign-in",
    }
  }
);