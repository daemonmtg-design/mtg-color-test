import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabase as adminSupabase } from '@/lib/supabase';
import JSZip from 'jszip';

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : [];
  if (authError || !user || !user.email || !adminEmails.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all responses with feedback
  const { data: responses, error: resErr } = await adminSupabase
    .from('responses')
    .select('*, feedback(*)')
    .order('created_at', { ascending: false });

  if (resErr) return NextResponse.json({ error: resErr.message }, { status: 500 });

  // Fetch all friend ratings
  const { data: friends, error: friErr } = await adminSupabase
    .from('friend_ratings')
    .select('*')
    .order('created_at', { ascending: false });

  if (friErr) return NextResponse.json({ error: friErr.message }, { status: 500 });

  // Build responses.csv
  const resCols = [
    'id', 'public_id', 'created_at', 'status', 'version', 'country', 'comparison_group',
    'settings_version_id', 'magic_experience', 'time_values', 'time_personality', 'time_motivations', 'time_dilemmas',
    'quality_flags'
  ];

  // Dynamically get answer keys from the first completed response
  const firstCompleted = responses.find(r => r.status === 'completed');
  let ansKeys: string[] = [];
  if (firstCompleted?.answers) {
    if (firstCompleted.answers.values) ansKeys.push(...Object.keys(firstCompleted.answers.values).map(k => 'val_' + k));
    if (firstCompleted.answers.personality) ansKeys.push(...Object.keys(firstCompleted.answers.personality).map(k => 'pers_' + k));
    if (firstCompleted.answers.motivations) ansKeys.push(...Object.keys(firstCompleted.answers.motivations).map(k => 'mot_' + k));
    if (firstCompleted.answers.dilemmas) {
      Object.keys(firstCompleted.answers.dilemmas).forEach(k => {
        ansKeys.push(`dil_${k}_most`);
        ansKeys.push(`dil_${k}_least`);
        ansKeys.push(`dil_${k}_order`);
      });
    }
  }

  const computedCols = [
    'raw_W', 'raw_U', 'raw_B', 'raw_R', 'raw_G',
    'z_W', 'z_U', 'z_B', 'z_R', 'z_G',
    'comb_W', 'comb_U', 'comb_B', 'comb_R', 'comb_G',
    'base_pct_W', 'base_pct_U', 'base_pct_B', 'base_pct_R', 'base_pct_G',
    'pct_W', 'pct_U', 'pct_B', 'pct_R', 'pct_G',
    'included', 'leans', 'missing', 'label', 'result_name',
    'feedback_accuracy', 'feedback_self_colors', 'feedback_self_unsure'
  ];

  const allResCols = [...resCols, ...ansKeys, ...computedCols];
  
  let resCsv = allResCols.join(',') + '\\n';
  for (const r of responses) {
    const row: any = {};
    row.id = r.id; row.public_id = r.public_id; row.created_at = r.created_at; row.status = r.status;
    row.version = r.version; row.country = r.country; row.comparison_group = r.comparison_group;
    row.settings_version_id = r.settings_version_id; row.magic_experience = r.magic_experience;
    row.time_values = r.section_times?.values;
    row.time_personality = r.section_times?.personality;
    row.time_motivations = r.section_times?.motivations;
    row.time_dilemmas = r.section_times?.dilemmas;
    row.quality_flags = r.quality_flags ? r.quality_flags.join(';') : '';

    if (r.answers) {
      if (r.answers.values) Object.keys(r.answers.values).forEach(k => row['val_' + k] = r.answers.values[k]);
      if (r.answers.personality) Object.keys(r.answers.personality).forEach(k => row['pers_' + k] = r.answers.personality[k]);
      if (r.answers.motivations) Object.keys(r.answers.motivations).forEach(k => row['mot_' + k] = r.answers.motivations[k]);
      if (r.answers.dilemmas) {
        Object.keys(r.answers.dilemmas).forEach(k => {
          row[`dil_${k}_most`] = r.answers.dilemmas[k].most;
          row[`dil_${k}_least`] = r.answers.dilemmas[k].least;
          row[`dil_${k}_order`] = r.dilemma_display_order?.[k]?.join(';');
        });
      }
    }

    if (r.raw) {
      ['W','U','B','R','G'].forEach(c => {
        row[`raw_${c}`] = r.raw.values?.[c] || '';
        row[`z_${c}`] = r.z?.values?.[c] || '';
        row[`comb_${c}`] = r.combined?.[c] || '';
        row[`base_pct_${c}`] = r.base_percentages?.[c] || '';
        row[`pct_${c}`] = r.percentages?.[c] || '';
      });
    }

    row.included = r.included?.join(';');
    row.leans = r.leans?.join(';');
    row.missing = r.missing?.join(';');
    row.label = r.label;
    row.result_name = r.result_name;

    const fb = r.feedback?.[0];
    if (fb) {
      row.feedback_accuracy = fb.accuracy;
      row.feedback_self_colors = fb.self_colors?.join(';');
      row.feedback_self_unsure = fb.self_unsure;
    }

    resCsv += allResCols.map(col => escapeCsv(row[col])).join(',') + '\\n';
  }

  // Build friend_ratings.csv
  const friCols = ['id', 'response_id', 'created_at', 'relationship', 'known_for', 'colors', 'colors_unsure'];
  let friAnsKeys: string[] = [];
  for (let i = 1; i <= 20; i++) friAnsKeys.push('ans_' + i);
  const traitCols = ['O', 'C', 'E', 'A', 'N'];
  
  const allFriCols = [...friCols, ...friAnsKeys, ...traitCols];
  let friCsv = allFriCols.join(',') + '\\n';
  for (const f of friends) {
    const row: any = {};
    row.id = f.id; row.response_id = f.response_id; row.created_at = f.created_at;
    row.relationship = f.relationship; row.known_for = f.known_for;
    row.colors = f.colors?.join(';'); row.colors_unsure = f.colors_unsure;
    
    if (f.answers) {
      for (let i = 1; i <= 20; i++) row['ans_' + i] = f.answers[i];
    }
    if (f.trait_scores) {
      traitCols.forEach(t => row[t] = f.trait_scores[t]);
    }
    friCsv += allFriCols.map(col => escapeCsv(row[col])).join(',') + '\\n';
  }

  // Build data_dictionary.csv
  const dictData = [
    ['Column', 'File', 'Description'],
    ['id', 'responses.csv', 'Unique UUID for the response'],
    ['public_id', 'responses.csv', 'Public short ID'],
    ['time_*', 'responses.csv', 'Time spent on the section in seconds'],
    ['quality_flags', 'responses.csv', 'Flags for bad data (e.g. implausibly_fast)'],
    ['val_* / pers_* / mot_*', 'responses.csv', 'Raw answers to questions'],
    ['dil_*', 'responses.csv', 'Dilemma choices and display order'],
    ['raw_* / z_* / comb_* / pct_*', 'responses.csv', 'Computed scores per color'],
    ['relationship / known_for', 'friend_ratings.csv', 'Context of the friend rating']
  ];
  const dictCsv = dictData.map(r => r.map(escapeCsv).join(',')).join('\\n') + '\\n';

  // Create ZIP
  const zip = new JSZip();
  zip.file('responses.csv', resCsv);
  zip.file('friend_ratings.csv', friCsv);
  zip.file('data_dictionary.csv', dictCsv);

  const buffer = await zip.generateAsync({ type: 'uint8array' });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="quiz_data_export.zip"'
    }
  });
}
