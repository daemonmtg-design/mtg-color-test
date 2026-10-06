import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology | MTG Color Quiz',
  description: 'How the MTG Color Quiz scores and assigns Magic: The Gathering colors based on psychological frameworks.',
};

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 space-y-8 text-gray-800 leading-relaxed mb-24">
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Methodology</h1>
      <p className="text-lg">
        This quiz assigns one or more of Magic: The Gathering's five colors based on your answers to four sections. The color definitions follow Mark Rosewater's descriptions of the color pie; the connections between psychological measures and colors are interpretations made for this quiz, not official.
      </p>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">The four sections</h2>
        <ul className="space-y-3 list-disc pl-5">
          <li><strong>Values (40 questions):</strong> based on Shalom Schwartz's theory of basic human values. Each value is measured relative to your own average answer, so the result reflects your priorities rather than how strongly you agree with things in general. A few values are interpreted in context: for example, high Hedonism counts more toward Black when Stimulation is low, and more toward Red when it is high.</li>
          <li><strong>Personality (50 questions):</strong> the Big Five traits, measured with the IPIP-50 from the International Personality Item Pool. Your traits are compared with average scores from your country or region (based on Schmitt et al., 2007), or a global average if you don't select a country.</li>
          <li><strong>Motivations (36 questions):</strong> a short Enneagram questionnaire written for this quiz. It identifies your most likely type or types, blending near-ties, and whether your answers reflect the type's healthy or stressed side. The Enneagram has a weaker research base than the other sections, and this section may be changed or removed after the first weeks, depending on how it performs.</li>
          <li><strong>Choices (15 groups):</strong> in each group, you choose the statement most and least like you. The statements were rated for appeal in advance and grouped so no option is the obviously "good" answer.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">How the scores are combined</h2>
        <ul className="space-y-3 list-disc pl-5">
          <li>Each of the first three sections produces a score for each color. These are converted into standard scores (how far above or below a typical respondent you are), so the sections are comparable.</li>
          <li>They are combined with these weights: values 35%, personality 40%, motivations 25%.</li>
          <li>The combined scores are turned into percentages that add up to 100%, using a softmax function. No color is ever set to zero.</li>
          <li>Your choices in the last section adjust each percentage by up to ±5%. This can tip close results, but cannot overturn a clear one.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Your result</h2>
        <ul className="space-y-3 list-disc pl-5">
          <li>A color is included if its percentage is at least 72% of your highest color's percentage.</li>
          <li>A color at 62–72% of your highest is shown as a lean.</li>
          <li>The confidence label (strong, moderate, or close call) shows how close any color is to the 72% line, so you know how likely a retake is to change your result.</li>
          <li>The results page explains which of your answers contributed most to each color.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Limitations</h2>
        <ul className="space-y-3 list-disc pl-5">
          <li>There is no objective test of someone's "true" color, so accuracy can only be checked indirectly, through feedback, friend ratings, and agreement between sections.</li>
          <li>All answers are self-reported and may reflect how you see yourself rather than how you behave.</li>
          <li>The typical values used for standard scores currently come from a simulation and will be replaced with real data as responses come in.</li>
          <li>The connections between psychological measures and colors are interpretations. They will be reviewed as data is collected.</li>
          <li>This is an early version; weights and thresholds may change.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">References</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li>Rosewater, M. (2015–2017). <em>Making Magic</em> articles on the color pie. Wizards of the Coast.</li>
          <li>Schwartz, S. H. (1992). Universals in the content and structure of values. <em>Advances in Experimental Social Psychology</em>, 25, 1–65.</li>
          <li>Schwartz, S. H. (2012). An overview of the Schwartz theory of basic values. <em>Online Readings in Psychology and Culture</em>, 2(1).</li>
          <li>Goldberg, L. R., et al. (2006). The International Personality Item Pool and the future of public-domain personality measures. <em>Journal of Research in Personality</em>, 40, 84–96.</li>
          <li>Schmitt, D. P., Allik, J., McCrae, R. R., & Benet-Martínez, V. (2007). The geographic distribution of Big Five personality traits. <em>Journal of Cross-Cultural Psychology</em>, 38(2), 173–212.</li>
        </ul>
      </div>
    </div>
  );
}
