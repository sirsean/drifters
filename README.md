# Drifters

This site is for looking at your nice Fringe Drifters, but in a prettier
interface than you get from the marketplaces that are trying to sell them.

## Run Locally

```bash
npm run dev
```

## Download Metadata & Images

If you need to refresh the metadata JSON and the drifter images, you can
use this handy script to fetch them all. It helpfully downscales the images,
which are quite large, so they'll be faster to load in the browser.

```bash
node src/scripts/downloader.js
```