import { writable } from 'svelte/store';
import type { UserProfile } from './types';

export const user = writable<UserProfile | undefined>();
