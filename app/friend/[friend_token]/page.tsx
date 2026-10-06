import { supabase } from '@/lib/supabase';
import FriendQuiz from '@/components/FriendQuiz';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function FriendPage({ params }: { params: { friend_token: string } }) {
  // 1. Verify token exists
  const { data: response, error } = await supabase
    .from('responses')
    .select('id')
    .eq('friend_token', params.friend_token)
    .single();

  if (error || !response) {
    return <div className="p-12 text-center text-xl text-red-600 font-medium">Invalid or expired link.</div>;
  }

  // 2. Enforce limit of 5
  const { count } = await supabase
    .from('friend_ratings')
    .select('id', { count: 'exact', head: true })
    .eq('response_id', response.id);

  if (count !== null && count >= 5) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center mt-10 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Thank you for your interest!</h1>
        <p className="text-gray-600">However, this person has already received the maximum number of friend ratings (5).</p>
      </div>
    );
  }

  return <FriendQuiz friendToken={params.friend_token} />;
}
