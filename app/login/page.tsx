"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Workflow, Loader2 } from "lucide-react";

/* ── Inline Google "G" SVG icon ─────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginFormContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const oauthError = searchParams.get("error");

  const [error, setError] = useState<string | null>(oauthError);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (oauthError) {
      setError(oauthError);
    }
  }, [oauthError]);

  const handleGoogleSignIn = () => {
    if (isConnecting) return;
    setError(null);
    setIsConnecting(true);

    const safeRedirect = redirect.startsWith("/") ? redirect : "/dashboard";
    const params = new URLSearchParams({ redirect: safeRedirect });
    window.location.href = `/api/auth/google?${params.toString()}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F8F5] p-4 text-[#1C1B18]">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-3 cursor-pointer group" aria-label="LeadFlow AI Home">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8D5B28] text-white shadow-xs group-hover:scale-105 transition-transform">
              <Workflow className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1C1B18]">
              LeadFlow AI
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[#1C1B18] tracking-tight">
            Welcome to LeadFlow AI
          </h1>
          <p className="mt-1 text-xs text-[#5C5850]">
            Intelligent CRM &amp; Sales Automation Platform
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#D9D2C4] bg-white p-7 shadow-xs">
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C] animate-fade-in"
            >
              <div className="font-semibold">Sign-in Notice</div>
              <div className="mt-0.5 text-[11px] text-[#7F1D1D] leading-snug">
                {error}
              </div>
            </div>
          )}

          {/* Google Sign-In Action */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-[#D9D2C4] bg-white py-3 px-4 text-sm font-semibold text-[#1C1B18] hover:bg-[#FAF8F5] active:bg-[#F3EFE7] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer focus-ring"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#8D5B28] animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-[#8C867B] leading-relaxed px-2">
              Sign in securely with your Google account to access your private workspace.
            </p>
          </div>
        </div>

        {/* Legal Links Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[#8C867B]">
          <Link href="/privacy" className="hover:text-[#1C1B18] transition-colors">
            Privacy Policy
          </Link>
          <span>&middot;</span>
          <Link href="/terms" className="hover:text-[#1C1B18] transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F8F5]" />}>
      <LoginFormContent />
    </Suspense>
  );
}
