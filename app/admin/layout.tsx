import Link from 'next/link'
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-4">
          <Link href="/admin" className="hover:text-blue-300">Dashboard</Link>
          <Link href="/admin/settings" className="hover:text-blue-300">Settings</Link>
          <Link href="/admin/recalc" className="hover:text-blue-300">Recalculate</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-slate-100 text-black">
        {children}
      </main>
    </div>
  )
}
