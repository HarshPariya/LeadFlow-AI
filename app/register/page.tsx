"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F8F5] text-[#1C1B18]">
      <div className="text-xs text-[#8C867B] animate-pulse">Redirecting to sign-in...</div>
    </div>
  );
}
