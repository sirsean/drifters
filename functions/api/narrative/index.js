import { makePagesFunction } from 'vite-plugin-cloudflare-functions/worker';
import sortBy from 'sort-by';

function parseDrifterId(key) {
    const m = key.match(/(\d+).json/);
    return m ? m[1] : null;
}

export const onRequestGet = makePagesFunction(async ({ env }) => {
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

    return listed.objects.map(obj => {
        return {
            drifterId: parseDrifterId(obj.key),
            uploaded: obj.uploaded,
        };
    }).sort(sortBy('-uploaded'));
});