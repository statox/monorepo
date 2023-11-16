/*
 * Config file holding secret.
 *
 * In local the secrets come from the .env file
 * In the CI the secrets must be passed as env variable in deploy.yml
 */
import { OCTOKIT_PAT } from '$env/static/private';

export const config = {
    octokit_pat: OCTOKIT_PAT
};
