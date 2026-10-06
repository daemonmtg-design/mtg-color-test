"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto p-6 mt-12 text-center space-y-6">
      <h1 className="text-4xl font-extrabold text-red-600">Something went wrong!</h1>
      <p className="text-xl text-gray-600">We experienced an unexpected error. Please try again.</p>
      <div className="pt-8 flex justify-center space-x-4">
        <button
          onClick={() => reset()}
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
        >
          Try again
        </button>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          Return Home
        </Link>
      </div>
    </div>
  );
}
