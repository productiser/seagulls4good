import Anthropic from '@anthropic-ai/sdk';
import charityConfig from '../../../charity-config.json';

const client = new Anthropic();

const SYSTEM = `You are "The Seagull" — Brighton's most opinionated bird. You've given up stealing chips and now work for {charityName} ({charityTagline}). You're sardonic, dry, and witty. Brighton born and bred.

Rules:
- Respond with 1–3 short punchy sentences only. Never more.
- Stay completely in character as a reluctantly helpful seagull.
- Do not use quotation marks in your response.
- Do not say "I am" or introduce yourself.
- Reference Brighton, the seafront, or the charity naturally where it fits.
- Be dry and slightly superior but ultimately on the user's side.`;

const FALLBACKS: Record<string, string> = {
  intro: `Oi. Up here. Yeah — me. The seagull. Caw.\nI've packed in the chip-nicking. I work for {charityName} now. Long, tragic story.\nTwo questions, {name}. Both right, you're a {charityName} Voice. One wrong… you owe us. Ready? Course you are.`,
  'react-correct': 'Bang on.',
  'react-wrong': 'Wrong. Boldly so.',
  'finish-win': `Two from two. You're revoltingly Brighton. Certified. Get over here.`,
  'finish-lose': `Swooped, fried, and factually incorrect. Bleak. {charityName} it is, then.`,
};

function interp(text: string, name: string, charityName: string) {
  return text.replace(/\{name\}/g, name).replace(/\{charityName\}/g, charityName);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { phase, name, question, answer, correctAnswer, allCorrect } = body;
  const charity = charityConfig;

  const system = SYSTEM
    .replace('{charityName}', charity.charityName)
    .replace('{charityTagline}', charity.charityTagline);

  let userPrompt = '';
  if (phase === 'intro') {
    userPrompt = `Greet ${name} with exactly 3 short lines (separated by newlines, no blank lines between them). Cover: (1) a dramatic seagull entrance, (2) mention you work for ${charity.charityName} now and gave up chips, (3) lay out the challenge: two trivia questions, both right = they're a ${charity.charityName} Voice, any wrong = they owe the flock. Go.`;
  } else if (phase === 'react-correct') {
    userPrompt = `${name} correctly answered the question "${question}" with "${answer}". Give a brief dry reaction — reluctant to admit they got it right. 1 sentence max.`;
  } else if (phase === 'react-wrong') {
    userPrompt = `${name} wrongly answered "${question}". They said "${answer}" but the answer was "${correctAnswer}". Brief roast. 1 sentence max.`;
  } else if (phase === 'finish-win') {
    userPrompt = `${name} got both questions right. Declare them a ${charity.charityName} Voice dramatically but briefly. 1–2 sentences.`;
  } else if (phase === 'finish-lose') {
    userPrompt = `${name} got at least one question wrong. Roast them in 1–2 sentences as a mildly disgusted seagull. End with telling them they now owe ${charity.charityName} a good deed.`;
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 180,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : 'Caw.';
    return Response.json({ text });
  } catch {
    const fallback = interp(FALLBACKS[phase] || 'Caw.', name, charity.charityName);
    return Response.json({ text: fallback });
  }
}
