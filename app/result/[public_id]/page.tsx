import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';
import * as E from '@/lib/explain';
import Results from '@/components/Results';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ResultPage({ params }: { params: { public_id: string } }) {
  const { data: response, error } = await supabase
    .from('responses')
    .select('*')
    .eq('public_id', params.public_id)
    .single();

  if (error || !response) {
    return <div className="p-12 text-center text-red-600">Result not found.</div>;
  }

  const { count: friendCount } = await supabase
    .from('friend_ratings')
    .select('id', { count: 'exact', head: true })
    .eq('response_id', response.id);

  // Need quizData for Results component
  const quizPath = path.join(process.cwd(), 'data', 'quiz_content.json');
  const quizData = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));

  // Load the settings used for this response
  let norms = null;
  let stats = null;

  if (response.settings_version_id) {
    const { data: sv } = await supabase
      .from('settings_versions')
      .select('norms, typical_values')
      .eq('id', response.settings_version_id)
      .single();
    if (sv) {
      norms = sv.norms;
      stats = sv.typical_values;
    }
  }

  // Fallback if settings vanished
  if (!norms || !stats) {
    const normsPath = path.join(process.cwd(), 'data', 'big_five_country_norms.json');
    norms = JSON.parse(fs.readFileSync(normsPath, 'utf-8'));
    const statsPath = path.join(process.cwd(), 'data', 'typical_values.json');
    stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
  }

  const { version, answers, comparison_group } = response;
  
  // Re-run explain to get the sentences (lines)
  const valItems = quizData.sections.values[version];
  const valuesAns = valItems.map((item: any) => answers.values[item.id]);

  const persItems = quizData.sections.personality[version];
  const big5Ans = persItems.map((item: any) => answers.personality[item.id]);
  const big5Keys = persItems.map((item: any) => [item.trait, item.reversed]);

  const motItems = quizData.sections.motivations.items;
  const ennAns = motItems.map((item: any) => answers.motivations[item.id]);
  const ennKeys = motItems.map((item: any) => [item.type, item.side]);

  const dilGroups = quizData.sections.dilemmas.groups;
  const dilemmaChoices = dilGroups.map((g: any) => {
    const choice = answers.dilemmas[g.id];
    if (!choice) return ["W", "U"]; // Fallback if missing
    const mostStmt = g.statements.find((s: any) => s.id === choice.most);
    const leastStmt = g.statements.find((s: any) => s.id === choice.least);
    return [mostStmt.color, leastStmt.color];
  });

  // Resolve norms for this country/group
  let activeNorms = norms.regions["Global (all 56 nations)"];
  if (norms.countries && norms.countries[comparison_group]) {
    activeNorms = norms.countries[comparison_group];
  } else if (norms.regions && norms.regions[comparison_group]) {
    activeNorms = norms.regions[comparison_group];
  }

  const { r: calculatedResult, lines } = E.explain(
    version,
    valuesAns,
    big5Ans,
    big5Keys,
    ennAns,
    ennKeys,
    dilemmaChoices,
    activeNorms,
    stats[version],
    comparison_group
  );

  // We use the result directly from the DB so it is permanently frozen,
  // but we use the newly generated `lines` for the text.
  // Wait, `calculatedResult` and `response` properties should be identical.
  const storedResult = {
    raw: response.raw,
    z: response.z,
    combined: response.combined,
    dilemma: response.dilemma,
    base_percentages: response.base_percentages,
    percentages: response.percentages,
    included: response.included,
    leans: response.leans,
    missing: response.missing,
    label: response.label,
    result_name: response.result_name
  };

  const resultData = {
    result: storedResult,
    lines,
    countryLabel: comparison_group,
    friendCount: friendCount || 0
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <Results 
        resultData={resultData} 
        quizData={quizData} 
        isResultPage={true}
      />
    </div>
  );
}
