import AuthStatus from "@/components/auth/auth-status";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-8 rounded-xl bg-white p-12 shadow dark:bg-zinc-900">
        
        <h1 className="text-3xl font-bold">
          Slide AI
        </h1>

        <p className="text-center text-zinc-600 dark:text-zinc-400">
          AI destekli sunum oluşturucu
        </p>

        {/* AUTH KONTROLÜ */}
        <AuthStatus />

      </main>
    </div>
  );
}
