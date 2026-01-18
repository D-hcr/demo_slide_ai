import { auth } from "@/lib/auth"
import AuthStatus from "@/components/auth/auth-status"
import CreateDocumentForm from "@/components/documents/CreateDocumentForm"
import SlideWorkspace from "@/components/slides/SlideWorkspace"

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* SOL PANEL – CHAT / DOC */}
      <div className="flex w-full md:w-1/2 flex-col border-r border-zinc-800 p-6">
        <h1 className="text-2xl font-bold mb-2">Slide AI</h1>
        <p className="text-sm text-zinc-400 mb-6">
          AI destekli sunum oluşturucu
        </p>

        <AuthStatus />

        {session && (
          <div className="mt-6">
            <CreateDocumentForm />
          </div>
        )}
      </div>

      {/* SAĞ PANEL – SLIDE PREVIEW */}
      <div className="hidden md:flex w-1/2 bg-zinc-900 p-6">
        {session ? (
          <SlideWorkspace />
        ) : (
          <div className="m-auto text-zinc-500">
            Slide oluşturmak için giriş yap
          </div>
        )}
      </div>

    </div>
  )
}
