"use client";

import { useEffect, useState, useMemo } from 'react';
import { useQuizStore } from '@/lib/store';
import Select from 'react-select';
import { countryOptions } from '@/lib/countries';
import Results from '@/components/Results';

function shuffle(array: any[]) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default function QuizApp() {
  const store = useQuizStore();
  const [quizData, setQuizData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [quickEnabled, setQuickEnabled] = useState<boolean | null>(null);

  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    fetch('/api/quiz-data')
      .then(res => res.json())
      .then(data => setQuizData(data));
    
    fetch('/api/quiz-config')
      .then(res => res.json())
      .then(data => setQuickEnabled(data.quickEnabled));
  }, []);

  // Sync page index if section changes (basic reset)
  useEffect(() => {
    setPageIndex(0);
  }, [store.status]);

  if (!quizData || quickEnabled === null) return <div className="p-8 text-center text-gray-500">Loading MTG Color Quiz...</div>;

  
  if (store.status === 'landing') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            MTG Color Quiz: What Magic: The Gathering Color Are You?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your true colors. This comprehensive quiz analyzes your values, personality traits, internal motivations, and how you resolve dilemmas to find your exact place among all 31 color combinations.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => store.setStatus('consent')}
              className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg transition transform hover:-translate-y-1"
            >
              Start the Quiz
            </button>
            <p className="text-sm text-gray-500 mt-3">Free, anonymous, and unofficial. Takes about 10-15 minutes.</p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b px-6 py-4">
            <h2 className="text-xl font-bold text-gray-800">How It Works</h2>
          </div>
          <div className="p-6 md:p-8 space-y-6 text-gray-700 leading-relaxed">
            <p>
              Unlike most personality quizzes that just ask "what is your favorite element", this test is built on established psychological frameworks mapping directly to Mark Rosewater's color pie philosophy:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Values:</strong> Based on Schwartz's theory of basic human values, finding out what principles guide your life.</li>
              <li><strong>Personality:</strong> Utilizing the Big Five framework (via the IPIP) to measure your natural disposition.</li>
              <li><strong>Motivations:</strong> Drawing from Enneagram theory to uncover your core fears and desires.</li>
              <li><strong>Dilemmas:</strong> Putting you in hypothetical situations to see how you resolve conflicting ideals.</li>
            </ul>
            <p>
              At the end, you will receive a detailed breakdown of your results, showing exactly how much of each of the five colors you possess, your confidence label, and which of the 31 possible combinations (Mono-color, Guilds, Shards, Wedges, etc.) you align with most.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg mb-2">What MTG color am I?</h3>
              <p className="text-gray-600">The only way to find out is to take the quiz! Magic: The Gathering defines five colors (White, Blue, Black, Red, Green), each representing a different philosophy on life, goals, and methods.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg mb-2">How accurate is this?</h3>
              <p className="text-gray-600">We aim for high psychological validity, but please note this is an <strong>early version</strong> still being calibrated. Because it relies on self-reporting, it's only as accurate as you are honest!</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg mb-2">How long does it take?</h3>
              <p className="text-gray-600">The long version consists of 141 questions and typically takes about 10-15 minutes to complete thoughtfully. A shorter "quick" version is currently in development and coming soon.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg mb-2">Is my data stored?</h3>
              <p className="text-gray-600">Your answers are stored completely anonymously in our EU-based servers to help us calibrate the scoring engine. We do not collect names, emails, IPs, or any personally identifiable information. See our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-lg mb-2">Is this official?</h3>
              <p className="text-gray-600">No, this is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t space-y-4">
          <p className="text-sm text-gray-500">
            Want to see the math? Read our <a href="/methodology" className="text-blue-600 hover:underline">Methodology</a>.
          </p>
        </div>
      </div>
    );
  }


  if (store.status === 'consent') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6 mt-12">
        <h2 className="text-2xl font-bold">Privacy & Consent</h2>
        <div className="bg-gray-50 p-4 rounded border text-sm text-gray-700 leading-relaxed">
          This quiz is a free, unofficial fan project. Your answers are stored anonymously, with no names, emails, or other identifying information, and used only to improve the quiz. By continuing, you agree to this. You can stop at any time.
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => store.setStatus('version')}
            className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700"
          >
            I Accept
          </button>
        </div>
      </div>
    );
  }

  
  if (store.status === 'version') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6 mt-12 text-center">
        <h2 className="text-2xl font-bold">Choose your version</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-6 rounded-xl flex flex-col items-center justify-between h-full bg-white shadow-sm hover:shadow-md transition">
            <div className="space-y-2 mb-6">
              <h3 className="text-xl font-bold text-gray-800">Long Version</h3>
              <p className="text-sm text-gray-500 font-medium">141 questions &middot; ~10-15 mins</p>
              <p className="text-gray-600 mt-2">Deep, highly accurate psychological assessment.</p>
            </div>
            <button 
              onClick={() => { store.setVersion('long'); store.markSectionStart(); store.setStatus('country'); }}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 w-full transition"
            >
              Start Long Version
            </button>
          </div>

          <div className="border p-6 rounded-xl flex flex-col items-center justify-between h-full bg-gray-50 relative overflow-hidden">
            {!quickEnabled && (
              <div className="absolute top-4 right-[-30px] bg-yellow-400 text-yellow-900 text-xs font-bold px-10 py-1 rotate-45">
                COMING SOON
              </div>
            )}
            <div className="space-y-2 mb-6 opacity-60">
              <h3 className="text-xl font-bold text-gray-800">Quick Version</h3>
              <p className="text-sm text-gray-500 font-medium">~5 mins</p>
              <p className="text-gray-600 mt-2">A faster, slightly less precise assessment.</p>
            </div>
            <button 
              disabled={!quickEnabled}
              onClick={() => { store.setVersion('quick'); store.markSectionStart(); store.setStatus('country'); }}
              className={`px-8 py-3 rounded-lg font-medium w-full transition ${quickEnabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              {quickEnabled ? 'Start Quick Version' : 'Temporarily Disabled'}
            </button>
          </div>
        </div>
      </div>
    );
  }


  if (store.status === 'country') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6 mt-12">
        <h2 className="text-2xl font-bold">Where are you from? (Optional)</h2>
        <p className="text-gray-600">This helps us compare your results to typical cultural averages.</p>
        <Select 
          options={countryOptions}
          onChange={(val) => store.setCountry(val?.value || null)}
          placeholder="Select a country..."
          isClearable
          className="text-black"
        />
        <div style={{ display: 'none' }}>
          <label htmlFor="website">Website</label>
          <input type="text" id="website" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
        </div>
        <button 
          onClick={async () => {
            let finalCountry = store.country;
            if (!finalCountry) {
              finalCountry = "Prefer not to say";
              store.setCountry(finalCountry);
            }
            
            try {
              const res = await fetch('/api/response/start', {
                method: 'POST',
                body: JSON.stringify({ version: store.version, country: finalCountry, hp: honeypot }),
                headers: { 'Content-Type': 'application/json' }
              });
              const data = await res.json();
              store.setSecretToken(data.secret_token);
              store.setPublicId(data.public_id);
              store.setFriendToken(data.friend_token);
            } catch (e) {
              console.error("Failed to start DB response:", e);
            }
            store.markSectionStart();
            store.setStatus('values');
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 w-full"
        >
          Continue
        </button>
      </div>
    );
  }

  if (store.version === 'quick' && !quickEnabled && store.status !== 'landing' && store.status !== 'version') {
    return (
      <div className="max-w-xl mx-auto p-8 space-y-6 mt-12 text-center bg-white rounded-lg shadow border border-gray-200">
        <h2 className="text-2xl font-bold text-red-600">Quick Version Unavailable</h2>
        <p className="text-gray-700 font-medium">
          The quick version of the quiz is temporarily disabled during our alpha phase. 
          Your progress for the quick version has been paused.
        </p>
        <p className="text-gray-600">
          Please take the long version to help us calibrate the results!
        </p>
        <div className="pt-4">
          <button 
            onClick={() => { store.reset(); store.setVersion('long'); store.setStatus('country'); }}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            Start Long Version
          </button>
        </div>
      </div>
    );
  }

  // Quiz Sections
  const sectionsOrder = ['values', 'personality', 'motivations', 'dilemmas'] as const;
  const currentSectionIdx = sectionsOrder.indexOf(store.status as any);

  if (currentSectionIdx !== -1) {
    const sectionKey = store.status as typeof sectionsOrder[number];
    const isDilemmas = sectionKey === 'dilemmas';
    const sectionData = quizData.sections[sectionKey];
    
    // items: values, personality have quick/long. motivations has items. dilemmas has groups.
    const items = isDilemmas ? sectionData.groups : (sectionData[store.version!] || sectionData.items);
    const instruction = sectionData.instruction;
    const scale = sectionData.scale || [];

    const perPage = 8;
    const startIndex = pageIndex * perPage;
    const endIndex = Math.min(startIndex + perPage, items.length);
    const currentItems = items.slice(startIndex, endIndex);

    const answersObj = store.answers[sectionKey];
    
    const allAnswered = currentItems.every((item: any) => {
      if (isDilemmas) {
        const ans = (answersObj as any)[item.id];
        return ans && ans.most && ans.least;
      }
      return (answersObj as any)[item.id] !== undefined;
    });

    const handleNext = async () => {
      if (!allAnswered) return;
      if (endIndex >= items.length) {
        // Next section or submit
        const nextIdx = currentSectionIdx + 1;
        if (nextIdx < sectionsOrder.length) {
          const nextSection = sectionsOrder[nextIdx];
          store.recordSectionTime(sectionKey);
          store.markSectionStart();
          store.setStatus(nextSection);
          if (store.secret_token) {
            fetch('/api/response/progress', {
              method: 'POST',
              body: JSON.stringify({
                secret_token: store.secret_token,
                last_section: nextSection,
                answers: store.answers,
                dilemma_display_order: store.dilemmaOrder
              }),
              headers: { 'Content-Type': 'application/json' }
            }).catch(console.error);
          }
        } else {
          store.recordSectionTime(sectionKey);
          store.markSectionStart();
          store.setStatus('experience');
          try {
            const res = await fetch('/api/score', {
              method: 'POST',
              body: JSON.stringify({
                version: store.version,
                country: store.country,
                answers: store.answers,
                secret_token: store.secret_token,
                dilemma_display_order: store.dilemmaOrder
              }),
              headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            
            if (data.error) {
               alert("Server error: " + data.error);
               store.setStatus('dilemmas');
               return;
            }
            if (data.public_id) {
               window.location.href = `/result/${data.public_id}`;
            } else {
               setResultData(data);
               store.setStatus('results');
            }
          } catch (e) {
            console.error(e);
            alert("Error submitting answers.");
            store.setStatus('dilemmas');
          }
        }
      } else {
        setPageIndex(pageIndex + 1);
        window.scrollTo(0, 0);
      }
    };

    // Calculate total progress
    let totalItems = 0;
    let answeredItems = 0;
    sectionsOrder.forEach((sec) => {
      const sData = quizData.sections[sec];
      const sItems = sec === 'dilemmas' ? sData.groups : (sData[store.version!] || sData.items);
      totalItems += sItems.length;
      answeredItems += Object.keys(store.answers[sec]).length;
    });
    const progress = Math.round((answeredItems / totalItems) * 100);

    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-8 mb-24">
        {/* Progress bar */}
        <div className="sticky top-0 bg-white pt-2 pb-4 z-10 border-b">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold capitalize">{sectionKey}</h2>
          <p className="text-gray-700 font-medium bg-blue-50 p-4 rounded-lg">{instruction}</p>
        </div>

        <div className="space-y-12">
          {currentItems.map((item: any, idx: number) => {
            const itemNum = startIndex + idx + 1;
            
            if (isDilemmas) {
              const ans = (answersObj as any)[item.id] || {};
              
              // Randomize order once and store it
              if (!store.dilemmaOrder[item.id]) {
                const order = shuffle(item.statements.map((s:any) => s.id));
                store.setDilemmaOrder(item.id, order);
              }
              const order = store.dilemmaOrder[item.id] || item.statements.map((s:any)=>s.id);
              const statements = order.map((id:string) => item.statements.find((s:any) => s.id === id));

              return (
                <div key={item.id} className="p-4 md:p-6 bg-white border rounded-xl shadow-sm space-y-4">
                  <div className="font-semibold text-gray-800">Group {itemNum}</div>
                  <div className="space-y-3">
                    {statements.map((stmt: any) => (
                      <div key={stmt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-gray-800">{stmt.text}</span>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            className={`px-3 py-1.5 rounded text-sm font-medium border ${ans.most === stmt.id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 hover:border-green-400'} ${ans.least === stmt.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                              if (ans.least === stmt.id) return;
                              store.setAnswer('dilemmas', item.id, { ...ans, most: stmt.id });
                            }}
                          >Most like me</button>
                          <button 
                            className={`px-3 py-1.5 rounded text-sm font-medium border ${ans.least === stmt.id ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 hover:border-red-400'} ${ans.most === stmt.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                              if (ans.most === stmt.id) return;
                              store.setAnswer('dilemmas', item.id, { ...ans, least: stmt.id });
                            }}
                          >Least like me</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else {
              // Standard scale
              const val = (answersObj as any)[item.id];
              return (
                <div key={item.id} className="p-4 md:p-6 bg-white border rounded-xl shadow-sm space-y-4">
                  <div className="font-semibold text-gray-800"><span className="text-gray-400 mr-2">{itemNum}.</span> {item.text}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
                    {scale.map((label: string, sIdx: number) => {
                      const score = sectionKey === 'personality' ? sIdx + 1 : (sectionKey === 'motivations' ? sIdx + 1 : sIdx + 1); // all are 1-based index
                      return (
                        <button
                          key={sIdx}
                          onClick={() => store.setAnswer(sectionKey, item.id, score)}
                          className={`flex-1 min-w-[100px] p-2 text-sm rounded border transition-colors ${val === score ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50'}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }
          })}
        </div>

        <div className="pt-8 border-t flex justify-between items-center">
          <button onClick={store.reset} className="text-gray-500 text-sm hover:underline">
            Restart Quiz
          </button>
          <button 
            onClick={handleNext}
            disabled={!allAnswered}
            className={`px-8 py-3 rounded-lg font-bold text-white transition-opacity ${allAnswered ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed opacity-70'}`}
          >
            {endIndex >= items.length ? (currentSectionIdx === sectionsOrder.length - 1 ? 'Submit' : 'Next Section') : 'Next Page'}
          </button>
        </div>
      </div>
    );
  }

  
  if (store.status === 'experience') {
    const handleExpSubmit = async (val) => {
      store.setMagicExperience(val);
      store.recordSectionTime('experience');
      store.setStatus('submitting');
      
      try {
        const res = await fetch('/api/score', {
          method: 'POST',
          body: JSON.stringify({
            version: store.version,
            country: store.country,
            magic_experience: val,
            section_times: store.section_times,
            answers: store.answers,
            secret_token: store.secret_token,
            dilemma_display_order: store.dilemmaOrder
          }),
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        
        if (data.error) {
           alert("Server error: " + data.error);
           store.setStatus('experience');
           return;
        }
        if (data.public_id) {
           window.location.href = `/result/${data.public_id}`;
        } else {
           setResultData(data);
           store.setStatus('results');
        }
      } catch (e) {
        console.error(e);
        alert("Error submitting answers.");
        store.setStatus('experience');
      }
    };

    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8 mb-24 mt-10">
        <h2 className="text-2xl font-bold">One last question...</h2>
        <div className="p-6 bg-white border rounded-xl shadow-sm space-y-6">
          <p className="text-gray-800 font-medium text-lg">Have you played Magic: The Gathering?</p>
          <div className="flex flex-col space-y-3">
            <button onClick={() => handleExpSubmit('No')} className="p-3 text-left border rounded hover:bg-blue-50 hover:border-blue-300">No, never</button>
            <button onClick={() => handleExpSubmit('A little')} className="p-3 text-left border rounded hover:bg-blue-50 hover:border-blue-300">A little / I know the basics</button>
            <button onClick={() => handleExpSubmit('Yes, regularly')} className="p-3 text-left border rounded hover:bg-blue-50 hover:border-blue-300">Yes, regularly</button>
            <button onClick={() => handleExpSubmit(null)} className="p-3 text-left border rounded text-gray-500 hover:bg-gray-50 text-sm mt-4">Prefer not to answer (Skip)</button>
          </div>
        </div>
      </div>
    );
  }

  if (store.status === 'submitting') {
    return <div className="p-8 text-center text-xl font-medium mt-12 animate-pulse">Calculating your true colors...</div>;
  }

  if (store.status === 'results') {
    if (!resultData) {
      // If resultData is missing (e.g. user refreshed the page before redirect, or DB failed), reset.
      setTimeout(() => store.reset(), 0);
      return <div className="p-8 text-center text-xl font-medium mt-12 animate-pulse">Loading...</div>;
    }
    return (
      <Results 
        resultData={resultData} 
        quizData={quizData} 
        onRetake={store.reset} 
      />
    );
  }

  return null;
}
