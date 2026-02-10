import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { DateTime } from 'luxon';

describe('/ephemerides/getRange', () => {
    /*
     * We consider that the libraries we are using to get lunar and sun data are
     * already well tested so we just need to validate the shape of our response
     */
    it('Valid small range', async () => {
        const response = await request(app)
            .post('/ephemerides/getRange')
            .send({
                to: 1770751300466, // Around 2026-02-10T19:22:16
                from: 1770319387652 // Around 2026-02-05T19:23:03
            })
            .expect(200);

        const { ephemerides } = response.body;

        assert.lengthOf(ephemerides, 6);
    });

    it('Valid large range', async () => {
        const startTs = 1770751300466;
        const endTs = DateTime.fromMillis(startTs).plus({ days: 360 }).toMillis();
        const response = await request(app)
            .post('/ephemerides/getRange')
            .send({
                to: endTs,
                from: startTs
            })
            .expect(200);

        const { ephemerides } = response.body;

        assert.lengthOf(ephemerides, 360);
    });

    it('Invalid range - End date before start date', async () => {
        const startTs = 1770751300466;
        const endTs = DateTime.fromMillis(startTs).minus({ days: 1 }).toMillis();
        const response = await request(app)
            .post('/ephemerides/getRange')
            .send({
                to: endTs,
                from: startTs
            })
            .expect(400);

        assert.equal(response.text, '{"message":"RANGE_IS_INVALID"}');
    });

    it('Invalid range - Too large', async () => {
        const startTs = 1770751300466;
        const endTs = DateTime.fromMillis(startTs).plus({ days: 362 }).toMillis();
        const response = await request(app)
            .post('/ephemerides/getRange')
            .send({
                to: endTs,
                from: startTs
            })
            .expect(400);

        assert.equal(response.text, '{"message":"RANGE_TOO_LARGE"}');
    });
});
