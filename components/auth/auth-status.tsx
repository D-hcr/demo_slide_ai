"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Yükleniyor...</p>;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800"
      >
        Google ile giriş yap
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {session.user?.image && (
        <Image
          src={session.user.image}
          alt="User avatar"
          width={64}
          height={64}
          className="rounded-full"
        />
      )}

      <p className="text-lg font-medium">
        Hoş geldin {session.user?.name}
      </p>

      <p className="text-sm text-zinc-500">
        {session.user?.email}
      </p>

      <button
        onClick={() => signOut()}
        className="rounded-lg bg-red-500 px-6 py-3 text-white hover:bg-red-600"
      >
        Çıkış yap
      </button>
    </div>
  );
}
