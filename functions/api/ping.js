export function onRequestGet() {
    return new Response(JSON.stringify({
        now: new Date()
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}