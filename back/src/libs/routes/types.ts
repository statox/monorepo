import { Response } from 'express';
import { FromSchema, JSONSchema } from 'json-schema-to-ts';
import { WebSocket } from 'ws';
import { emptyObjectSchema } from './helpers.js';
import { LoggableContext } from '../modules/logging/index.js';
import { User } from '../modules/auth/types.js';
import { ErrorCode } from '../errors/codes.js';

type RouteParams<Input> = {
    input: Input;
    loggableContext: LoggableContext;
    authenticatedUser?: User;
};
type RouteWithFileParams<Input> = RouteParams<Input> & {
    file?: ApiFile;
};
export type RouteHandler<Input> = (params: RouteParams<Input>) => Promise<unknown> | unknown;

/*
 * The multipart handler fills the file field with the file it parsed.
 * Originally the type is Express.Multer.File but this original type is too wide.
 * Since we use only multer.diskStorage there are some fields (`buffer`) which
 * are never populated, also some types are deprecated (`encoding`) so we override the
 * type with our own.
 */
export interface ApiFile {
    /** Name of the form field associated with this file. */
    fieldname: string;
    /** Value of the `Content-Type` header for this file. */
    mimetype: string;
    /** Size of the file in bytes. */
    size: number;
    /** `DiskStorage` only: Directory to which this file has been uploaded. */
    destination: string;
    /** `DiskStorage` only: Name of this file within `destination`. */
    filename: string;
    /** `DiskStorage` only: Full path to the uploaded file. */
    path: string;
}
export type RouteWithFileHandler<Input> = (
    params: RouteWithFileParams<Input>
) => Promise<unknown> | unknown;

export type ApiJsonSchema = JSONSchema;

// TODO: Would it make more sense to have that as a single type? (probably yes)
export type EmptyInput = FromSchema<typeof emptyObjectSchema>;
export type EmptyOutput = FromSchema<typeof emptyObjectSchema>;

// List of possible scopes
export const SCOPES = ['public', 'admin', 'homeTracker', 'personalTracker'] as const;
type ScopesType = typeof SCOPES;
export type Scope = ScopesType[number];

type BaseRouteCommon<Input, Output> = {
    path: string;
    handler: RouteHandler<Input>;
    outputSchema: ApiJsonSchema;
    // TODO at one point we might want to wrap the response in a custom object
    customResponseHandler?: (output: Output, res: Response) => void;
    clientErrors?: ErrorCode[];
};

type BaseRouteUser2<Input, Output> = BaseRouteCommon<Input, Output> & {
    // Routes with authentication type user2 must have a scope
    authentication: 'user2';
    scope: Scope;
};

type BaseRouteNotUser2<Input, Output> = BaseRouteCommon<Input, Output> & {
    // Routes with authentication type different than user2 must not have a scope
    authentication: 'none' | 'user' | 'apikey-iot' | 'apikey';
    scope?: never;
};

export type BaseRoute<Input, Output> =
    | BaseRouteUser2<Input, Output>
    | BaseRouteNotUser2<Input, Output>;

export type GetRoute<Input, Output> = BaseRoute<Input, Output> & {
    method: 'get';
};

export type PostRoute<Input, Output> = BaseRoute<Input, Output> & {
    method: 'post';
    inputSchema: ApiJsonSchema;
};

export type PostWithFileRoute<Input, Output> = PostRoute<Input, Output> & {
    handler: RouteWithFileHandler<Input>;
    file: {
        maxSize: number;
        allowedMimes: string[];
    };
};

export const isPostWithFileRoute = (
    route: Route<unknown, unknown>
): route is PostWithFileRoute<unknown, unknown> => {
    return (
        'file' in route &&
        typeof (route as PostWithFileRoute<unknown, unknown>).file === 'object'
    );
};

export type Route<Input, Output> =
    | GetRoute<Input, Output>
    | PostRoute<Input, Output>
    | PostWithFileRoute<Input, Output>;

export type RouteWS = {
    onConnection: (ws: WebSocket, gameId: string) => void;
    path: string;
};
