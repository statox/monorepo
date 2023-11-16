import { octokit } from '$lib/server/octokit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (): Promise<any> => {
    const chordsCheckResult = await getLastCheckChordsWorkflow();
    return chordsCheckResult;
};

const WORKFLOW_URL = 'https://api.github.com/repos/statox/workshop/actions/runs';
const getLastCheckChordsWorkflow = async () => {
    const runsResponse = await octokit.rest.actions.listWorkflowRuns({
        repo: 'workshop',
        owner: 'statox',
        workflow_id: 'check_chords.yml',
        per_page: 10
    });
    const runs = runsResponse.data;
    const lastRun = runs.workflow_runs[0];
    const status = lastRun.conclusion;

    const lastRunTs = new Date(lastRun.created_at).getTime();
    if (status !== 'success') {
        return {
            timestamp: lastRunTs,
            status: lastRun.conclusion
        };
    }
    const {
        data: { artifacts }
    } = await octokit.rest.actions.listWorkflowRunArtifacts({
        repo: 'workshop',
        owner: 'statox',
        run_id: lastRun.id
    });

    const artifactData = artifacts[0];
    console.log({ artifactData });

    const artifactContentResponse = await octokit.request(artifactData.archive_download_url);

    console.log({ artifactContentResponse });
};

const testOctokit = async () => {
    // Compare: https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
    const {
        data: { login }
    } = await octokit.rest.users.getAuthenticated();
    console.log('Hello, %s', login);
};
