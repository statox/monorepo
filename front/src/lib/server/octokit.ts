import { Octokit } from 'octokit';
import { config } from '$config/config';

const token = config.octokit_pat;

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
export const octokit = new Octokit({ auth: token });
