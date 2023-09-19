import { makeRawPagesFunction, makeResponse } from 'vite-plugin-cloudflare-functions/worker';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Max-Age': '86400',
};

// Respond to OPTIONS method
export const onRequestOptions = makeRawPagesFunction(() => {
    return makeResponse({
        status: 204,
        headers,
    })
});
  
// Set CORS to all /api responses
export const onRequest = makeRawPagesFunction(async ({ next }) => {
    const response = await next();
    for (const key in headers) {
        response.headers.set(key, headers[key]);
    }
    //response.headers.set('Access-Control-Allow-Origin', '*');
    //response.headers.set('Access-Control-Max-Age', '86400');
    return response;
});