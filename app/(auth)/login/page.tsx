"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={() => signIn("google")}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Sign in with Google
      </button>
    </div>
  );
}
