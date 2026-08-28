import sinon from 'sinon';
import { DateTime } from 'luxon';
import { TestHelper } from '../TestHelper.js';
import { assert } from 'chai';

let sinonDateTimeNowStub: sinon.SinonStub | undefined;

const restoreDateTimeNow = () => {
    sinonDateTimeNowStub?.restore();
    sinonDateTimeNowStub = undefined;
};

class TestHelper_Time extends TestHelper {
    constructor() {
        super({
            name: 'Time',
            hooks: {
                afterEach: restoreDateTimeNow
            }
        });
    }

    fakeSinonDateTimeNow = (newNowTs: number) => {
        const newNow = DateTime.fromSeconds(newNowTs);
        sinonDateTimeNowStub = sinon.stub(DateTime, 'now');
        sinonDateTimeNowStub.returns(newNow);
    };

    restoreDateTimeNow = restoreDateTimeNow;

    isAroundNowSec = (ts: number, maxDelayInSeconds = 2) => {
        const diffFromNow = DateTime.fromSeconds(ts).diffNow('seconds').seconds;
        assert.isAtMost(
            Math.abs(diffFromNow),
            maxDelayInSeconds,
            `timestamp in seconds is not around now ${ts}`
        );
    };
}

export const testHelper_Time = new TestHelper_Time();
