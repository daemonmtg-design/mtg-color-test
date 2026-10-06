import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | MTG Color Quiz',
  description: 'Privacy policy for the MTG Color Quiz.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 space-y-8 text-gray-800 leading-relaxed mb-24">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">(last updated: [DATE])</p>
      </div>
      
      <p className="text-lg font-medium">
        This quiz is a free, unofficial fan project. We collect as little as possible, and nothing that identifies you.
      </p>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">What we store</h2>
        <p>
          Your answers to the quiz, your results, the country you select (optional), whether you've played Magic (optional), the time spent on each section, and your optional feedback. If someone uses your friend link, we store their answers about you, linked to your anonymous result.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">What we don't store</h2>
        <p>
          Names, email addresses, IP addresses, or any other information that identifies you. Our hosting providers (Vercel for the website and Supabase for the database) may process IP addresses briefly in their server logs for security and to deliver the site, as all web hosting does; we don't store or use them.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Why</h2>
        <p>
          Only to show your result and to improve the quiz's accuracy. We never sell or share the data, and we don't use it for advertising. By starting the quiz, you consent to this.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Where and how long</h2>
        <p>
          The database is hosted by Supabase in the European Union. Because the data is anonymous, it is kept for as long as the project runs.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Your browser</h2>
        <p>
          We don't use tracking cookies or analytics. The site saves your progress and a private feedback token in your browser's local storage, only so a reload doesn't lose your answers. You can clear it at any time through your browser settings. The only cookie is a login cookie used by the site administrator.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Friend ratings</h2>
        <p>
          Friend ratings are anonymous: neither you nor your friend can see each other's individual answers, and no names are collected.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Contact</h2>
        <p>
          For any questions about your data: <span className="text-blue-600 font-mono">[CONTACT EMAIL]</span>.
        </p>
      </div>
    </div>
  );
}
