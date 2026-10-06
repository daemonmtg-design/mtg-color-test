import fs from 'fs';
import path from 'path';

export function getSanitizedQuizData() {
  const filePath = path.join(process.cwd(), 'data', 'quiz_content.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // Deep clone to safely mutate
  const sanitized = JSON.parse(raw);

  // Strip keys from Values
  sanitized.sections.values.quick.forEach((item: any) => delete item.value);
  sanitized.sections.values.long.forEach((item: any) => delete item.value);

  // Strip keys from Personality
  sanitized.sections.personality.quick.forEach((item: any) => {
    delete item.trait;
    delete item.reversed;
  });
  sanitized.sections.personality.long.forEach((item: any) => {
    delete item.trait;
    delete item.reversed;
  });

  // Strip keys from Motivations
  sanitized.sections.motivations.items.forEach((item: any) => {
    delete item.type;
    delete item.side;
  });

  // Strip keys from Dilemmas
  sanitized.sections.dilemmas.groups.forEach((group: any) => {
    group.statements.forEach((stmt: any) => {
      delete stmt.color;
    });
  });

  return sanitized;
}
