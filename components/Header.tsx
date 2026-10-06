import Link from 'next/link';
import Image from 'next/image';
import { SETTINGS } from '@/lib/settings';

export default function Header() {
  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10">
            <Image 
              src="/brand/logo.svg" 
              alt="MTG Color Quiz" 
              fill 
              className="object-contain"
              priority 
            />
          </div>
          <span className="font-bold text-gray-900 text-lg sm:text-xl tracking-tight group-hover:text-blue-600 transition-colors">
            MTG Color Quiz
          </span>
          {SETTINGS.SITE_STAGE && (
            <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full border border-blue-200">
              {SETTINGS.SITE_STAGE}
            </span>
          )}
        </Link>
        
        <nav className="hidden sm:flex items-center space-x-6 text-sm font-medium text-gray-600">
          <Link href="/methodology" className="hover:text-blue-600 transition-colors">Methodology</Link>
          <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
        </nav>
      </div>
    </header>
  );
}
