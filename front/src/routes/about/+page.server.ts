import type { PageServerLoad } from './$types';
import {
    PUBLIC_GITHUB_COMMIT_MESSAGE,
    PUBLIC_GITHUB_COMMIT_URL,
    PUBLIC_GITHUB_COMMIT_SHA,
    PUBLIC_GITHUB_RUN_ID
} from '$env/static/public';
import type { BuildInfo } from './types';

const currentCommitInfo = () => {
    const shortSha = PUBLIC_GITHUB_COMMIT_SHA.slice(0, 7);

    return {
        commitSha: shortSha,
        commitMessage: PUBLIC_GITHUB_COMMIT_MESSAGE,
        commitLink: PUBLIC_GITHUB_COMMIT_URL
    };
};

const currentBuildInfo = () => {
    const pad = (v: number) => v.toString().padStart(2, '0');
    const now = new Date();
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const nowStr = `${day}/${month}/${year} ${hours}:${minutes}`;

    const url = `https://github.com/statox/apps/actions/runs/${PUBLIC_GITHUB_RUN_ID}`;
    return {
        buildTimeStr: nowStr,
        buildUrl: url
    };
};

export const load: PageServerLoad = (): BuildInfo => {
    const commitInfo = currentCommitInfo();
    const buildInfo = currentBuildInfo();
    return {
        ...commitInfo,
        ...buildInfo
    };
};
