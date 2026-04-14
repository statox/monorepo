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

    respondWithHtml = (html: string) => {
        fetchStub.resolves({
            ok: true,
            status: 200,
            text: async () => html
        } as unknown as Response);
    };

    respondWithNetworkError = (message = 'Network error') => {
        fetchStub.rejects(new Error(message));
    };
}

export const testHelper_Fetch = new TestHelper_Fetch();
