import Link from "next/link"

export function Navbar() {
  return (
    <nav className="border-b bg-surface sticky top-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-primary tracking-tight">
          Stacq
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/stacq/new" className="btn-primary">
            Create Stacq
          </Link>
        </div>
      </div>
    </nav>
  )
}
