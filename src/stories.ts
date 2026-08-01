import { Story } from './types';
import { STORIES_LIT1 } from './stories_lit1';
import { STORIES_LIT2 } from './stories_lit2';
import { STORIES_FABLES } from './stories_fables';
import { STORIES_LONG } from './stories_long';

export const PRACTICE_STORIES: Story[] = [
  ...STORIES_LIT1,
  ...STORIES_LIT2,
  ...STORIES_FABLES,
  ...STORIES_LONG
];
