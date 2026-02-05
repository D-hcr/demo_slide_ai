"use client"

import { signIn } from "next-auth/react"
import { FcGoogle } from "react-icons/fc"

export default function LoginScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-neutral-900 px-10 py-12 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Sunum oluşturmak için giriş yap</h1>

        <p className="text-sm text-neutral-400 text-center max-w-xs">
          Yapay zeka destekli sunumlar oluşturmak ve düzenlemek için Google hesabınla giriş yapabilirsin.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center gap-3 rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-neutral-200"
        >
          <FcGoogle size={20} />
          Google ile giriş yap
        </button>
      </div>
    </div>
  )
}
