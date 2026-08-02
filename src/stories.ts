import { Story } from './types';
import { STORIES_FABLES } from './stories_fables';
import { STORIES_LIT1 } from './stories_lit1';
import { STORIES_LIT2 } from './stories_lit2';
import { STORIES_LONG } from './stories_long';

export const PRACTICE_STORIES: Story[] = [
  ...STORIES_FABLES, // Easy
  ...STORIES_LIT1,   // Medium
  ...STORIES_LIT2,   // Hard
  ...STORIES_LONG    // Long / Hard
];
