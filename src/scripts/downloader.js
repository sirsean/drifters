import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const MAX_DRIFTERS = 3507;
const DRIFTERS_PATH = path.join('public', 'drifters', 'metadata');
const IMAGES_PATH = path.join('public', 'drifters', 'images');

async function downloadAndSaveDrifter(id) {
    return fetch(`https://omniscient.fringedrifters.com/main/metadata/${id}.json`)
        .then(r => r.body)
        .then(body => fs.writeFile(path.join(DRIFTERS_PATH, `${id}.json`), body))
}

async function downloadAllDrifters() {
    await fs.mkdir(DRIFTERS_PATH, { recursive: true })
    for (let id=1; id <= MAX_DRIFTERS; id++) {
        await downloadAndSaveDrifter(id)
            .then(() => console.log(`downloaded ${id}`))
            .catch(e => console.error(`failed to download ${id}`, e))
    }
}

async function downloadAndSaveImage(id) {
    return fetch(`https://omniscient.fringedrifters.com/main/images/${id}.jpeg`)
        .then(r => r.arrayBuffer())
        .then(sharp)
        .then(image => {
            return image.metadata()
                .then(({ width, height }) => image.resize(width / 4, height / 4).jpeg().toBuffer());
        })
        .then(buffer => fs.writeFile(path.join(IMAGES_PATH, `${id}.jpg`), buffer))
}

async function downloadAllImages() {
    await fs.mkdir(IMAGES_PATH, { recursive: true })
    for (let id=1; id <= MAX_DRIFTERS; id++) {
        await downloadAndSaveImage(id)
            .then(() => console.log(`downloaded ${id}`))
            .catch(e => console.error(`failed to download ${id}`, e))
    }
}

async function main() {
    await downloadAllDrifters();
    await downloadAllImages();
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });