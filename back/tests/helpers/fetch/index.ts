import sinon from 'sinon';
import { TestHelper } from '../TestHelper.js';

let fetchStub: sinon.SinonStub;

class TestHelper_Fetch extends TestHelper {
    constructor() {
        super({
            name: 'Fetch',
            hooks: {
                beforeEach: async () => {
                    fetchStub = sinon.stub(globalThis, 'fetch');
                },
                afterEach: async () => {
                    fetchStub.restore();
                }
            }
        });
    }

    respondWithHtmlForUrl = (url: string, html: string) => {
        fetchStub.withArgs(url).resolves(new Response(html));
    };

    respondWithNetworkErrorForUrl = (url: string, message = 'Network error') => {
        fetchStub.withArgs(url).rejects(new Error(message));
    };
}

export const testHelper_Fetch = new TestHelper_Fetch();
