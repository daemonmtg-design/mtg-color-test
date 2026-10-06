"use client";

import React, { useState } from 'react';

const STATEMENTS = [
  { id: 1, text: "Is the life of the party", trait: "E", r: false },
  { id: 2, text: "Sympathizes with others' feelings", trait: "A", r: false },
  { id: 3, text: "Gets chores done right away", trait: "C", r: false },
  { id: 4, text: "Has frequent mood swings", trait: "N", r: false },
  { id: 5, text: "Has a vivid imagination", trait: "O", r: false },
  { id: 6, text: "Doesn't talk a lot", trait: "E", r: true },
  { id: 7, text: "Is not interested in other people's problems", trait: "A", r: true },
  { id: 8, text: "Often forgets to put things back in their proper place", trait: "C", r: true },
  { id: 9, text: "Is relaxed most of the time", trait: "N", r: true },
  { id: 10, text: "Is not interested in abstract ideas", trait: "O", r: true },
  { id: 11, text: "Talks to a lot of different people at parties", trait: "E", r: false },
  { id: 12, text: "Feels others' emotions", trait: "A", r: false },
  { id: 13, text: "Likes order", trait: "C", r: false },
  { id: 14, text: "Gets upset easily", trait: "N", r: false },
  { id: 15, text: "Has difficulty understanding abstract ideas", trait: "O", r: true },
  { id: 16, text: "Keeps in the background", trait: "E", r: true },
  { id: 17, text: "Is not really interested in others", trait: "A", r: true },
  { id: 18, text: "Makes a mess of things", trait: "C", r: true },
  { id: 19, text: "Seldom feels blue", trait: "N", r: true },
  { id: 20, text: "Does not have a good imagination", trait: "O", r: true }
];

const CN: Record<string, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };

export default function FriendQuiz({ friendToken }: { friendToken: string }) {
  const [step, setStep] = useState<'consent' | 'quiz' | 'done'>('consent');
  const [relationship, setRelationship] = useState('');
  const [knownFor, setKnownFor] = useState('');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [expectedColors, setExpectedColors] = useState<string[]>([]);
  const [expectedNotSure, setExpectedNotSure] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const toggleExpectedColor = (c: string) => {
    if (expectedNotSure) setExpectedNotSure(false);
    if (expectedColors.includes(c)) {
      setExpectedColors(expectedColors.filter(color => color !== c));
    } else {
      setExpectedColors([...expectedColors, c]);
    }
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/friend/rating`, {
        method: 'POST',
        body: JSON.stringify({
          friend_token: friendToken,
          relationship,
          known_for: knownFor,
          answers,
          colors: expectedColors,
          colors_unsure: expectedNotSure,
          hp: honeypot
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setStep('done');
      } else {
        alert("Failed to submit");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting");
    }
    setIsSubmitting(false);
  };

  if (step === 'consent') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-10">
        <h1 className="text-2xl font-bold mb-4">Friend Personality Survey</h1>
        <p className="mb-4 text-gray-700">Someone asked you to describe them for a personality quiz. Your answers are anonymous and they won't see your individual answers. You won't see their result.</p>
        <p className="mb-6 text-gray-700 text-sm italic">This is an unofficial fan project, no tracking or analytics are used.</p>
        <button 
          onClick={() => setStep('quiz')}
          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 w-full"
        >
          I agree, let's start
        </button>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-10 text-center">
        <h1 className="text-2xl font-bold mb-4 text-green-700">Thank You!</h1>
        <p className="mb-6 text-gray-700">Your answers have been saved securely and anonymously.</p>
        <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
          Take the quiz yourself
        </a>
      </div>
    );
  }

  const allAnswered = STATEMENTS.every(s => answers[s.id]) && relationship && knownFor;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20 bg-gray-50 min-h-screen space-y-8">
      <div className="bg-white p-6 rounded shadow border border-gray-100">
        <h2 className="text-xl font-bold mb-4">About you (Anonymous)</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">How do you know this person?</label>
            <select value={relationship} onChange={e => setRelationship(e.target.value)} className="w-full p-2 border rounded bg-white">
              <option value="">Select...</option>
              <option value="friend">Friend</option>
              <option value="partner">Partner</option>
              <option value="family">Family</option>
              <option value="coworker">Coworker</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2">How long have you known them?</label>
            <select value={knownFor} onChange={e => setKnownFor(e.target.value)} className="w-full p-2 border rounded bg-white">
              <option value="">Select...</option>
              <option value="less than 1 year">Less than 1 year</option>
              <option value="1-5 years">1-5 years</option>
              <option value="more than 5 years">More than 5 years</option>
            </select>
          </div>
          <div style={{ display: 'none' }}>
            <label htmlFor="website-friend">Website</label>
            <input type="text" id="website-friend" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow border border-gray-100">
        <h2 className="text-xl font-bold mb-2">Personality</h2>
        <p className="mb-6 text-gray-600">Describe this person as they generally are now.</p>
        <div className="space-y-8">
          {STATEMENTS.map(s => (
            <div key={s.id} className="space-y-3">
              <p className="font-medium text-gray-800 text-lg">This person {s.text.toLowerCase()}...</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: 1, l: "Very inaccurate" },
                  { v: 2, l: "Moderately inaccurate" },
                  { v: 3, l: "Neither accurate nor inaccurate" },
                  { v: 4, l: "Moderately accurate" },
                  { v: 5, l: "Very accurate" }
                ].map(opt => (
                  <label key={opt.v} className={`flex-1 min-w-[140px] text-center border p-2 rounded cursor-pointer transition-colors ${answers[s.id] === opt.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 hover:bg-gray-100 text-sm'}`}>
                    <input type="radio" className="hidden" name={`q-${s.id}`} checked={answers[s.id] === opt.v} onChange={() => setAnswers({...answers, [s.id]: opt.v})} />
                    {opt.l}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow border border-gray-100 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Optional: Magic Colors</h2>
        <label className="block font-semibold text-gray-800">Which Magic color or combination would you describe this person as?</label>
        <div className="flex flex-wrap gap-3">
          {["W", "U", "B", "R", "G"].map(c => (
            <label key={c} className="flex items-center space-x-2 cursor-pointer p-2 bg-gray-50 rounded border hover:bg-gray-100">
              <input 
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded"
                checked={expectedColors.includes(c)}
                onChange={() => toggleExpectedColor(c)}
              />
              <span className="text-sm font-medium">{CN[c]}</span>
            </label>
          ))}
          <label className="flex items-center space-x-2 cursor-pointer p-2 bg-gray-50 rounded border hover:bg-gray-100">
            <input 
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded"
              checked={expectedNotSure}
              onChange={(e) => {
                setExpectedNotSure(e.target.checked);
                if (e.target.checked) setExpectedColors([]);
              }}
            />
            <span className="text-sm font-medium">I'm not sure / I don't play Magic</span>
          </label>
        </div>
      </div>

      <button 
        onClick={submit}
        disabled={!allAnswered || isSubmitting}
        className="w-full bg-blue-700 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-800 disabled:opacity-50 transition"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answers'}
      </button>
    </div>
  );
}
