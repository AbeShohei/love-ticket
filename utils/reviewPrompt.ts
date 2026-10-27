import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

const MATCH_COUNT_KEY = 'reviewPrompt.matchCount';
const LAST_PROMPT_KEY = 'reviewPrompt.lastPromptAt';

// Ask only after the couple has experienced the core value (a match) more than once.
const MIN_MATCHES_BEFORE_PROMPT = 2;
// Apple shows the dialog at most 3 times per year anyway; keep our own spacing wide.
const MIN_DAYS_BETWEEN_PROMPTS = 120;
// Let the match feedback finish before the system dialog appears.
const PROMPT_DELAY_MS = 1500;

/**
 * Call right after a match is created. Shows the system review dialog
 * at a positive moment, at most once every MIN_DAYS_BETWEEN_PROMPTS days.
 * Never throws.
 */
export async function onMatchForReviewPrompt(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const count = Number((await AsyncStorage.getItem(MATCH_COUNT_KEY)) ?? '0') + 1;
    await AsyncStorage.setItem(MATCH_COUNT_KEY, String(count));
    if (count < MIN_MATCHES_BEFORE_PROMPT) return;

    const last = Number((await AsyncStorage.getItem(LAST_PROMPT_KEY)) ?? '0');
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);
    if (last > 0 && daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;

    if (!(await StoreReview.isAvailableAsync())) return;
    if (!(await StoreReview.hasAction())) return;

    await AsyncStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
    setTimeout(() => {
      StoreReview.requestReview().catch(() => {});
    }, PROMPT_DELAY_MS);
  } catch {
    // Review prompt is best-effort only.
  }
}
