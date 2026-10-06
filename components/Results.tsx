"use client";

import React from 'react';

const CN: Record<string, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };

const colorStyles: Record<string, string> = {
  W: "bg-[#fcfaf3] border border-gray-300 text-gray-800",
  U: "bg-[#0e68ab] text-white",
  B: "bg-[#151515] text-white",
  R: "bg-[#d3202a] text-white",
  G: "bg-[#00733e] text-white"
};

export default function Results({ resultData, quizData, onRetake, isResultPage }: { resultData: any, quizData: any, onRetake?: () => void, isResultPage?: boolean }) {
  const { result, lines, countryLabel } = resultData;
  const sortedColors = ["W", "U", "B", "R", "G"].sort((a, b) => lines[b].pct - lines[a].pct);
  
  // Resolve Result Name
  const includedSet = new Set(result.included);
  let matchedKey = "";
  for (const k of Object.keys(quizData.results)) {
    if (k.length === result.included.length && [...k].every(c => includedSet.has(c))) {
      matchedKey = k;
      break;
    }
  }
  const resultNameStr = quizData.results[matchedKey] || "Unknown";
  
  let headline = `Result: ${resultNameStr}`;
  if (result.included.length > 1) {
    const colorNames = result.included.map((c: string) => CN[c]).join(", ");
    headline += ` (${colorNames})`;
  }

  // Confidence text
  let closestColor = "W";
  let minDiff = 999;
  for (const c of ["W", "U", "B", "R", "G"]) {
    const diff = Math.abs(lines[c].ratio - 0.72);
    if (diff < minDiff) {
      minDiff = diff;
      closestColor = c;
    }
  }
  const x = Math.round(lines[closestColor].ratio * 100);
  const colorName = CN[closestColor];
  const label = result.label;
  
  let confidenceText = "";
  if (label === "strong") confidenceText = `Strong. The closest color to the threshold is ${colorName}, at ${x}% of your highest score (threshold: 72%).`;
  else if (label === "moderate") confidenceText = `Moderate. ${colorName} is at ${x}% of your highest score (threshold: 72%).`;
  else confidenceText = `Close call. ${colorName} is at ${x}% of your highest score, right at the threshold of 72%; a retake could change whether it is included.`;

  // Feedback state
  const [accuracy, setAccuracy] = React.useState<number | null>(null);
  const [expectedColors, setExpectedColors] = React.useState<string[]>([]);
  const [expectedNotSure, setExpectedNotSure] = React.useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = React.useState(false);
  const [friendLink, setFriendLink] = React.useState('');
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mtg-quiz-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state && parsed.state.friend_token) {
            setFriendLink(`${window.location.origin}/friend/${parsed.state.friend_token}`);
          }
        } catch (e) {}
      }
    }
  }, []);

  const handleFeedbackSubmit = async () => {
    // In a real implementation, this would POST to the backend
    try {
      const secret_token = typeof window !== 'undefined' ? localStorage.getItem('mtg-quiz-storage') ? JSON.parse(localStorage.getItem('mtg-quiz-storage') as string).state?.secret_token : null : null;
      if (secret_token) {
        await fetch('/api/feedback', {
          method: 'POST',
          body: JSON.stringify({
            secret_token,
            accuracy,
            self_colors: expectedColors,
            self_unsure: expectedNotSure
          }),
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (e) {
      console.error(e);
    }
    setFeedbackSubmitted(true);
  };

  const toggleExpectedColor = (c: string) => {
    if (expectedNotSure) setExpectedNotSure(false);
    if (expectedColors.includes(c)) {
      setExpectedColors(expectedColors.filter(color => color !== c));
    } else {
      setExpectedColors([...expectedColors, c]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-8 bg-white text-gray-900 pb-16">
      
      {/* 1. Result */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{headline}</h1>
        {/* 2. Confidence */}
        <p className="text-gray-700"><strong>Confidence:</strong> {confidenceText}</p>
      </div>

      {/* 3. Color Profile */}
      <section>
        <h2 className="text-xl font-bold mb-4">Color profile</h2>
        <div className="space-y-3 relative pb-8">
          
          {/* Chart area */}
          <div className="relative border-l border-gray-300 pl-4 py-2">
            {/* Lean band background */}
            <div className="absolute top-0 bottom-0 bg-gray-100 border-x border-gray-200 z-0" style={{ left: '62%', width: '10%' }}></div>
            {/* 72% Threshold line */}
            <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-400 z-0" style={{ left: '72%' }}></div>

            {sortedColors.map(c => {
              const widthPct = lines[c].ratio * 100;
              return (
                <div key={c} className="flex items-center mb-3 relative z-10">
                  <div className="w-16 font-semibold shrink-0" style={{ color: c === 'W' ? '#666' : colorStyles[c].split(' ')[0].replace('bg-[', '').replace(']', '') }}>
                    {CN[c]}
                  </div>
                  <div className="flex-1 flex items-center h-8">
                    <div className={`h-full flex items-center px-2 rounded-r shadow-sm ${colorStyles[c]}`} style={{ width: `${Math.max(widthPct, 2)}%` }}>
                      <span className={`text-xs font-bold ${c === 'W' ? 'text-gray-800' : 'text-white'}`}>{lines[c].pct.toFixed(1)}%</span>
                    </div>
                    <span className="ml-3 text-sm text-gray-500 hidden sm:inline">{lines[c].status}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Legend: Colors at or above 72% of your highest score are included in your result. Colors at 62–72% are shown as leans.
          </p>
        </div>
      </section>

      {/* 4. Why you got each color */}
      <section>
        <h2 className="text-xl font-bold mb-4">Why you got each color</h2>
        <div className="space-y-4">
          {sortedColors.filter(c => lines[c].status !== 'not included').map(c => (
            <div key={c} className="bg-gray-50 p-4 rounded border">
              <p className="font-semibold mb-2">{CN[c]} ({lines[c].pct.toFixed(1)}%): <span className="font-normal">{lines[c].sentence}</span></p>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {lines[c].details.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Why other colors are low */}
      <section>
        <h2 className="text-xl font-bold mb-4">Why other colors are low</h2>
        <div className="space-y-4">
          {sortedColors.filter(c => lines[c].status === 'not included').map(c => (
            <div key={c} className="bg-gray-50 p-4 rounded border">
              <p className="font-semibold mb-2">{CN[c]} ({lines[c].pct.toFixed(1)}%): <span className="font-normal">{lines[c].sentence}</span></p>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {lines[c].details.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Results by section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Results by section</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2">Section</th>
                <th className="p-2">White</th>
                <th className="p-2">Blue</th>
                <th className="p-2">Black</th>
                <th className="p-2">Red</th>
                <th className="p-2">Green</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">Values</td>
                {["W", "U", "B", "R", "G"].map(c => <td key={c} className="p-2">{(result.z.values[c] > 0 ? "+" : "")}{result.z.values[c].toFixed(2)}</td>)}
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Personality</td>
                {["W", "U", "B", "R", "G"].map(c => <td key={c} className="p-2">{(result.z.bigfive[c] > 0 ? "+" : "")}{result.z.bigfive[c].toFixed(2)}</td>)}
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Motivations</td>
                {["W", "U", "B", "R", "G"].map(c => <td key={c} className="p-2">{(result.z.enneagram[c] > 0 ? "+" : "")}{result.z.enneagram[c].toFixed(2)}</td>)}
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="p-2 font-medium">Comparison section adjustment</td>
                {["W", "U", "B", "R", "G"].map(c => {
                  const adj = lines[c].dilemma_change;
                  return <td key={c} className="p-2">{(adj > 0 ? "+" : "")}{adj.toFixed(1)}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">Standardized scores: 0 is the typical respondent; +1 is one standard deviation above.</p>
      </section>

      {/* 7. Method notes */}
      <section className="text-xs text-gray-500 space-y-2 border-t pt-6">
        <h2 className="text-sm font-bold text-gray-700">Method notes</h2>
        <p>Personality is compared with the {countryLabel}; values are compared with your own average rating. This quiz is in beta. The motivations section (Enneagram) may be changed or removed after the first weeks, depending on how it performs.</p>
        <p><a href="#" className="underline text-blue-600 hover:text-blue-800">Methodology page</a></p>
        <p className="pt-2">
          Unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.
        </p>
      </section>

      {/* 8. Optional Feedback & Friend Link */}
      <section className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-6">
        <h2 className="text-xl font-bold text-blue-900">Help us improve the quiz (Optional)</h2>
        
        {!feedbackSubmitted ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block font-semibold text-gray-800">How accurate does your result feel?</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: 1, label: "Not accurate at all" },
                  { val: 2, label: "Slightly accurate" },
                  { val: 3, label: "Moderately accurate" },
                  { val: 4, label: "Mostly accurate" },
                  { val: 5, label: "Very accurate" }
                ].map(opt => (
                  <button 
                    key={opt.val}
                    onClick={() => setAccuracy(opt.val)}
                    className={`flex-1 min-w-[120px] p-2 text-sm rounded border transition-colors ${accuracy === opt.val ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 hover:border-blue-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-semibold text-gray-800">Which color or combination would you have described yourself as?</label>
              <div className="flex flex-wrap gap-3">
                {["W", "U", "B", "R", "G"].map(c => (
                  <label key={c} className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded border border-gray-200 hover:bg-gray-50">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={expectedColors.includes(c)}
                      onChange={() => toggleExpectedColor(c)}
                    />
                    <span className="text-sm font-medium">{CN[c]}</span>
                  </label>
                ))}
                <label className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded border border-gray-200 hover:bg-gray-50">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
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
              onClick={handleFeedbackSubmit}
              disabled={accuracy === null && expectedColors.length === 0 && !expectedNotSure}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Feedback
            </button>
          </div>
        ) : (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            Thank you! Your feedback has been submitted anonymously.
          </div>
        )}

        <div className="border-t border-blue-200 pt-6 space-y-3 mt-4">
          <h3 className="font-bold text-gray-800">Ask a friend (Peer Review)</h3>
          <p className="text-sm text-gray-700">
            Want to see how others perceive you? Send this private link to 1 or 2 people who know you well. 
            They will take a quick 3-minute personality survey about you (and optionally guess your MTG colors). 
            They won't see your result, so their answers stay unbiased!
          </p>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input 
              type="text" 
              readOnly 
              value={friendLink} 
              className="flex-1 p-2 border rounded bg-white w-full text-sm font-mono text-gray-600 outline-none" 
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button 
              onClick={() => navigator.clipboard.writeText(friendLink)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-800 text-white rounded font-medium text-sm hover:bg-gray-900 shrink-0"
            >
              Copy Link
            </button>
          </div>
          <p className="text-sm font-semibold text-blue-900 pt-2">Friends who answered: {resultData.friendCount || 0}</p>
        </div>
      </section>

      {/* 9. Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t">
        <button onClick={() => { if (onRetake) onRetake(); else window.location.href = '/'; }} className="px-6 py-3 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition">
          Retake the quiz
        </button>
        <button className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition">
          Share
        </button>
      </div>

    </div>
  );
}
