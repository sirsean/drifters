const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Max-Age': '86400',
};

// Respond to OPTIONS method
export function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers,
    });
}
  
// Set CORS to all /api responses
export async function onRequest({ next }) {
    const response = await next();
    for (const key in headers) {
        response.headers.set(key, headers[key]);
    }
    return response;
}