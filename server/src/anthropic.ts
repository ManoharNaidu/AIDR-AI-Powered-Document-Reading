import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export interface PageExcerpt {
  page: number;
  text: string;
}

export interface AskResult {
  answer: string;
  citationPage: number;
}

const ANSWER_TOOL = {
  name: 'answer_with_citation',
  description: 'Provide the answer to the user along with the single page number it is primarily grounded in.',
  input_schema: {
    type: 'object' as const,
    properties: {
      answer: { type: 'string', description: "The answer to the user's question, written in 1-3 sentences." },
      citationPage: { type: 'integer', description: 'The page number (from the provided excerpts) the answer is drawn from.' },
    },
    required: ['answer', 'citationPage'],
  },
};

export async function askDocumentAssistant(
  question: string,
  excerpts: PageExcerpt[],
  documentTitle: string
): Promise<AskResult> {
  const context = excerpts.map((e) => `--- Page ${e.page} ---\n${e.text}`).join('\n\n');

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system:
      `You are Folio's Document Assistant, answering questions about the document "${documentTitle}". ` +
      'Answer ONLY using the provided page excerpts. Keep answers concise (1-3 sentences). ' +
      "If the excerpts don't contain the answer, say so honestly and still cite the closest relevant page. " +
      'Always call the answer_with_citation tool with your response.',
    messages: [
      {
        role: 'user',
        content: `${context}\n\n--- Question ---\n${question}`,
      },
    ],
    tools: [ANSWER_TOOL],
    tool_choice: { type: 'tool', name: 'answer_with_citation' },
  });

  const toolUse = message.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Assistant did not return a structured answer.');
  }
  const input = toolUse.input as { answer: string; citationPage: number };
  const fallbackPage = excerpts[0]?.page ?? 1;
  return {
    answer: input.answer,
    citationPage: Number.isFinite(input.citationPage) ? input.citationPage : fallbackPage,
  };
}
