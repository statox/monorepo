import sinon from 'sinon';
import { assert } from 'chai';
import { TestHelper } from '../TestHelper.js';

let fetchStub: sinon.SinonStub;

class TestHelper_Fetch extends TestHelper {
    constructor() {
        super({
            name: 'Fetch',
            hooks: {
                beforeEach: () => {
                    fetchStub = sinon.stub(globalThis, 'fetch');
                },
                afterEach: () => {
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

    checkCalledWithUrl = (url: string) => {
        assert.isTrue(
            fetchStub.calledWith(url),
            `Expected fetch to have been called with "${url}", actual calls: ${JSON.stringify(
                fetchStub.args.map((args) => args[0])
            )}`
        );
    };

    checkNotCalled = () => {
        sinon.assert.notCalled(fetchStub);
    };
}

export const testHelper_Fetch = new TestHelper_Fetch();
