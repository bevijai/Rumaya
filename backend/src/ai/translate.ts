import { env } from '../env';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  id: 'Indonesian',
  my: 'Burmese',
  vi: 'Vietnamese',
  bn: 'Bengali',
  tl: 'Filipino (Tagalog)',
  zh: 'Chinese (Simplified)',
  ta: 'Tamil',
  hi: 'Hindi',
  ne: 'Nepali',
  th: 'Thai',
  km: 'Khmer',
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

export const SUPPORTED_LANGUAGE_CODES = Object.keys(LANGUAGE_NAMES);

export interface TranslationService {
  translate(text: string, targetLanguage: string): Promise<string>;
}

class AnthropicTranslationService implements TranslationService {
  constructor(private readonly apiKey: string) {}

  async translate(text: string, targetLanguage: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Translate the message below into ${languageName(targetLanguage)}. Output ONLY the translated text, with no quotes, notes, or explanations.\n\nMessage:\n${text}`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic translate failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { content?: { text?: string }[] };
    return data.content?.[0]?.text?.trim() ?? text;
  }
}

/** Dev-only fallback: prefixes the language code instead of calling a real API. */
class EchoTranslationService implements TranslationService {
  async translate(text: string, targetLanguage: string): Promise<string> {
    return `[${targetLanguage}] ${text}`;
  }
}

export const translationService: TranslationService = env.ANTHROPIC_API_KEY
  ? new AnthropicTranslationService(env.ANTHROPIC_API_KEY)
  : new EchoTranslationService();

/** Translates `text` (already in `sourceLanguage`) into every language in `targetLanguages`, in parallel. */
export async function translateToMany(
  text: string,
  sourceLanguage: string,
  targetLanguages: string[],
): Promise<Record<string, string>> {
  const translations: Record<string, string> = { [sourceLanguage]: text };
  const uniqueTargets = [...new Set(targetLanguages)].filter((lang) => lang !== sourceLanguage);

  await Promise.all(
    uniqueTargets.map(async (lang) => {
      try {
        translations[lang] = await translationService.translate(text, lang);
      } catch (err) {
        // A transient network/API failure shouldn't block sending the message —
        // fall back to the original text for that language and keep going.
        // eslint-disable-next-line no-console
        console.error(`Translation to "${lang}" failed, using original text as fallback:`, err);
        translations[lang] = text;
      }
    }),
  );

  return translations;
}
