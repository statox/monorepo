import sinon from 'sinon';
import { assert } from 'chai';
import type { NextFunction, Request, Response } from 'express';
import { errorHandler } from '../../src/libs/middleware/errors.middleware.js';

// Helper to build a minimal mock Response that satisfies errorHandler's usage:
// response.locals, response.status(code).json(body)
const makeMockResponse = () => {
    const jsonSpy = sinon.spy();
    const statusStub = sinon.stub().returns({ json: jsonSpy });
    const response = {
        locals: {},
        status: statusStub,
        json: jsonSpy
    } as unknown as Response;
    return { response, statusStub, jsonSpy };
};

describe('errors middleware - errorHandler', () => {
    it('does not call next() after sending a 500 for an unrecognized error', async () => {
        const { response } = makeMockResponse();
        const nextSpy = sinon.spy() as unknown as NextFunction;
        const request = { url: '/test' } as unknown as Request;

        await errorHandler(new Error('unexpected failure'), request, response, nextSpy);

        assert.isFalse(
            (nextSpy as sinon.SinonSpy).called,
            'next() must not be called after the response is sent — calling it risks "headers already sent" errors'
        );
    });
});
