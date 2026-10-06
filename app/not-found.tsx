import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto p-6 mt-12 text-center space-y-6">
      <h1 className="text-4xl font-extrabold text-gray-900">404 - Page Not Found</h1>
      <p className="text-xl text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
      <div className="pt-8">
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Return Home
        </Link>
      </div>
    </div>
  );
}
