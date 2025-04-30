import sortBy from 'sort-by';

function parseDrifterId(key) {
    const m = key.match(/(\d+).json/);
    return m ? m[1] : null;
}

export async function onRequestGet({ env }) {
    try {
        const options = {
            limit: 1000,
        };

        const listed = await env.DRIFTER_NARRATIVES.list(options);
        let truncated = listed.truncated;
        let cursor = truncated ? listed.cursor : undefined;

        while (truncated) {
            const next = await env.DRIFTER_NARRATIVES.list({
                ...options,
                cursor,
            });
            listed.objects.push(...next.objects);

            truncated = next.truncated;
            cursor = next.cursor;
        }

        const data = listed.objects.map(obj => {
            return {
                drifterId: parseDrifterId(obj.key),
                uploaded: obj.uploaded,
            };
        }).sort(sortBy('-uploaded'));

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error listing narratives:", error);
        return new Response(JSON.stringify({
            error: error.message || 'An error occurred'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}