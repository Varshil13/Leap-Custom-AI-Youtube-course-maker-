import { Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import { ClerkProvider, GoogleOneTap } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LEAP",
  
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <GoogleOneTap />

    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f8fafc',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
    </ClerkProvider>
  );
}
