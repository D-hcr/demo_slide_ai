import AuthStatus from "@/components/auth/auth-status";
import { auth } from "@/lib/auth";
import CreateDocumentButton from "@/components/documents/CreateDocumentButton";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-8 rounded-xl bg-white p-12 shadow dark:bg-zinc-900">

        <h1 className="text-3xl font-bold">
          Slide AI
        </h1>

        <p className="text-center text-zinc-600 dark:text-zinc-400">
          AI destekli sunum oluşturucu
        </p>

        {/* AUTH DURUMU */}
        <AuthStatus />

        {/* GİRİŞ YAPILDIYSA */}
        {session && (
          <div className="pt-4">
            <CreateDocumentButton />
          </div>
        )}

      </main>
    </div>
  );
}
