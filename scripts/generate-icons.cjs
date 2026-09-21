// Requires sharp (available in the bundled Codex runtime or via NODE_PATH).
// The SVG sources are editable; PNGs are compatibility fallbacks for installed PWAs.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
(async () => {
	const root = path.resolve(__dirname, '..');
	const mark = fs.readFileSync(path.join(root, 'static/icon.svg'));
	const launcher = fs.readFileSync(path.join(root, 'static/icon-maskable.svg'));
	fs.writeFileSync(path.join(root, 'src/lib/assets/favicon.svg'), mark);
	for (const folder of ['android', 'ios']) {
		for (const file of fs.readdirSync(path.join(root, 'static', folder))) {
			if (!file.endsWith('.png')) continue;
			const size = Number(file.match(/(\d+)(?:x\d+)?\.png$/)[1]);
			const source = folder === 'ios' && size <= 32 ? mark : launcher;
			await sharp(source)
				.resize(size, size)
				.png()
				.toFile(path.join(root, 'static', folder, file));
		}
	}
	await sharp(mark).resize(512, 512).png().toFile(path.join(root, 'src/lib/assets/favicon.png'));
	console.log('Regenerated SVG favicon and all Android/iOS PNG icons.');
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
