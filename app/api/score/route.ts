import { NextResponse } from 'next/server';
import * as S from '../../../lib/scoring';
import * as E from '../../../lib/explain';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { version, answers, country, secret_token, dilemma_display_order, magic_experience, section_times } = body;

    // Load active settings from DB
    const { data: settingsRow, error: settingsError } = await supabase
      .from('settings_versions')
      .select('*')
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    let normsData: any;
    let statsData: any;
    let settingsVersionId = null;
    let quickEnabled = false;

    const { SETTINGS } = await import('@/lib/settings');

    if (settingsRow) {
      normsData = settingsRow.norms;
      statsData = settingsRow.typical_values;
      settingsVersionId = settingsRow.id;
      quickEnabled = settingsRow.settings?.QUICK_VERSION_ENABLED ?? SETTINGS.QUICK_VERSION_ENABLED;
    } else {
      // Fallback
      normsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'big_five_country_norms.json'), 'utf-8'));
      statsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'typical_values.json'), 'utf-8'));
      quickEnabled = SETTINGS.QUICK_VERSION_ENABLED;
    }

    if (version === 'quick' && !quickEnabled) {
      return NextResponse.json({ error: 'The quick version is temporarily disabled during alpha.' }, { status: 400 });
    }

    const quizPath = path.join(process.cwd(), 'data', 'quiz_content.json');
    const quizData = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));

    const valItems = quizData.sections.values[version];
    const valuesAns = valItems.map((item: any) => answers.values[item.id]);

    const persItems = quizData.sections.personality[version];
    const big5Ans = persItems.map((item: any) => answers.personality[item.id]);
    const big5Keys = persItems.map((item: any) => [item.trait, item.reversed]);

    const motItems = quizData.sections.motivations.items;
    const ennAns = motItems.map((item: any) => answers.motivations[item.id]);
    const ennKeys = motItems.map((item: any) => [item.type, item.side]);

    const validateAnswers = (ansArray: any[], label: string, bounds: [number, number]) => {
      if (ansArray.includes(undefined) || ansArray.includes(null)) {
        throw new Error(`Missing answers in ${label} section.`);
      }
      if (!ansArray.every(a => typeof a === 'number' && a >= bounds[0] && a <= bounds[1])) {
        throw new Error(`Invalid answer bounds in ${label} section.`);
      }
    };

    validateAnswers(valuesAns, 'values', [1, 6]);
    validateAnswers(big5Ans, 'personality', [1, 5]);
    validateAnswers(ennAns, 'motivations', [1, 5]);

    const dilGroups = quizData.sections.dilemmas.groups;
    const dilemmaChoices = dilGroups.map((g: any) => {
      const choice = answers.dilemmas[g.id];
      if (!choice || !choice.most || !choice.least) {
        throw new Error(`Missing dilemma answer in group ${g.id}`);
      }
      if (choice.most === choice.least) {
        throw new Error(`Duplicate most/least in dilemma group ${g.id}`);
      }
      const mostStmt = g.statements.find((s: any) => s.id === choice.most);
      const leastStmt = g.statements.find((s: any) => s.id === choice.least);
      return [mostStmt.color, leastStmt.color];
    });

    let norms = normsData.regions["Global (all 56 nations)"];
    let countryLabel = "global average";
    
    if (country && country !== "Prefer not to say") {
      if (normsData.countries[country]) {
        norms = normsData.countries[country];
        countryLabel = country;
      } else if (normsData.regions[country]) {
        norms = normsData.regions[country];
        countryLabel = country;
      }
    }

    const { r: result, lines } = E.explain(
      version,
      valuesAns,
      big5Ans,
      big5Keys,
      ennAns,
      ennKeys,
      dilemmaChoices,
      norms,
      statsData[version],
      countryLabel
    );

    // Resolve Result Name
    const includedSet = new Set(result.included);
    let matchedKey = "";
    for (const k of Object.keys(quizData.results)) {
      if (k.length === result.included.length && [...k].every(c => includedSet.has(c))) {
        matchedKey = k;
        break;
      }
    }
    
    // Calculate quality flags
    const quality_flags = [];
    if (section_times) {
      let totalQuestions = 0;
      if (answers.values) totalQuestions += Object.keys(answers.values).length;
      if (answers.personality) totalQuestions += Object.keys(answers.personality).length;
      if (answers.motivations) totalQuestions += Object.keys(answers.motivations).length;
      if (answers.dilemmas) totalQuestions += Object.keys(answers.dilemmas).length;
      
      let totalTime = Object.values(section_times).reduce((a, b) => a + b, 0);
      if (totalTime > 0 && totalQuestions > 0 && (totalTime / totalQuestions) < 1.5) {
        quality_flags.push('implausibly_fast');
      }
    }

    ['values', 'personality', 'motivations'].forEach(sec => {
      if (answers[sec]) {
        const vals = Object.values(answers[sec]);
        if (vals.length >= 10 && vals.every(v => v === vals[0])) {
          quality_flags.push('same_answer_all_' + sec);
        }
      }
    });

    const resultNameStr = quizData.results[matchedKey] || "Unknown";


    // If secret_token is provided (normal flow), update the DB
    if (secret_token) {
      const { data: updateData, error: updateError } = await supabase
        .from('responses')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
          settings_version_id: settingsVersionId,
          comparison_group: countryLabel,
          answers,
          dilemma_display_order,
          raw: result.raw,
          z: result.z,
          combined: result.combined,
          dilemma: result.dilemma,
          base_percentages: result.base_percentages,
          percentages: result.percentages,
          included: result.included,
          leans: result.leans,
          missing: result.missing,
          label: result.label,
          result_name: resultNameStr,
          magic_experience: magic_experience || null,
          section_times: section_times || {},
          quality_flags
        })
        .eq('secret_token', secret_token)
        .select('public_id')
        .single();

      if (updateError) throw updateError;
      
      return NextResponse.json({ success: true, public_id: updateData.public_id, secret_token, friendCount: 0 });
    }

    // Fallback for tests or dev route without DB
    return NextResponse.json({ result, lines, countryLabel, friendCount: 0 });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
