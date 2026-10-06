"use client";

import { useEffect, useState } from 'react';
import Results from '@/components/Results';
import { notFound } from 'next/navigation';
import testCaseLong from '@/data/test_case_long.json';

export default function DevResultPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  const [resultData, setResultData] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch sanitized quiz data for UI
    fetch('/api/quiz-data')
      .then(res => res.json())
      .then(data => setQuizData(data));
      
    // 2. Format the testCaseLong answers
    const answers = {
      values: testCaseLong.inputs.values,
      personality: testCaseLong.inputs.personality,
      motivations: testCaseLong.inputs.motivations,
      dilemmas: testCaseLong.inputs.dilemmas.reduce((acc: any, d: any) => {
        acc[d.group] = { most: d.most, least: d.least };
        return acc;
      }, {})
    };

    // 3. Score it
    fetch('/api/score', {
      method: 'POST',
      body: JSON.stringify({
        version: testCaseLong.version,
        country: testCaseLong.country,
        answers
      }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => setResultData(data))
      .catch(console.error);

  }, []);

  if (!resultData || !quizData) {
    return <div className="p-8 text-center text-xl">Simulating test_case_long.json...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-4xl mx-auto bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 mb-4 rounded text-center">
        <strong>Dev Mode:</strong> Displaying static result from <code>data/test_case_long.json</code>
      </div>
      <Results 
        resultData={resultData} 
        quizData={quizData} 
        onRetake={() => { window.location.href = '/' }} 
      />
    </div>
  );
}
