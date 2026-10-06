import { describe, it, expect } from 'vitest';
import * as S from '../lib/scoring';
import testCase from '../data/test_case.json';
import quizContent from '../data/quiz_content.json';
import typicalValues from '../data/typical_values.json';
import countryNorms from '../data/big_five_country_norms.json';

describe('Scoring Engine', () => {
  it('matches reference scoring output exactly', () => {
    const big5_keys = quizContent.sections.personality.quick.map((q: any) => [q.trait, q.reversed] as [string, boolean]);
    const enn_keys = quizContent.sections.motivations.items.map((q: any) => [q.type, q.side] as [number, "H" | "U"]);

    let result = S.score(
      "quick", 
      testCase.inputs.values,
      testCase.inputs.big5,
      big5_keys,
      testCase.inputs.enn,
      enn_keys,
      testCase.inputs.dilemmas as [S.Color, S.Color][],
      countryNorms.regions["Global (all 56 nations)"],
      typicalValues.quick
    );

    // Check components
    for (let c of S.COLORS) {
      expect(result.raw.values[c]).toBeCloseTo(testCase.raw.values[c as keyof typeof testCase.raw.values], 4);
      expect(result.raw.bigfive[c]).toBeCloseTo(testCase.raw.bigfive[c as keyof typeof testCase.raw.bigfive], 4);
      expect(result.raw.enneagram[c]).toBeCloseTo(testCase.raw.enneagram[c as keyof typeof testCase.raw.enneagram], 4);

      expect(result.z.values[c]).toBeCloseTo(testCase.z.values[c as keyof typeof testCase.z.values], 4);
      expect(result.z.bigfive[c]).toBeCloseTo(testCase.z.bigfive[c as keyof typeof testCase.z.bigfive], 4);
      expect(result.z.enneagram[c]).toBeCloseTo(testCase.z.enneagram[c as keyof typeof testCase.z.enneagram], 4);

      expect(result.combined[c]).toBeCloseTo(testCase.combined[c as keyof typeof testCase.combined], 4);
      expect(result.dilemma[c]).toBeCloseTo(testCase.dilemma[c as keyof typeof testCase.dilemma], 4);
      expect(result.percentages[c]).toBeCloseTo(testCase.percentages[c as keyof typeof testCase.percentages], 4);
    }

    // Expected exact matching arrays
    expect(result.included.sort()).toEqual(testCase.included.sort());
    expect(result.leans.sort()).toEqual(testCase.leans.sort());
    expect(result.label).toBe(testCase.label);
    
    // Test that the final percentages always sum to 100
    let totalPct = Object.values(result.percentages).reduce((a, b) => a + b, 0);
    expect(totalPct).toBeCloseTo(100, 4);
  });
});
