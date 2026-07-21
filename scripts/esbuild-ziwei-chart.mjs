import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const entryPoint = 'js/ui/ziwei-chart-entry.jsx';
const fingerprintFiles = [
    entryPoint,
    'scripts/esbuild-ziwei-chart.mjs',
    'package-lock.json'
];
const buildHash = createHash('sha256');
for (const file of fingerprintFiles) {
    const source = await readFile(file, 'utf8');
    buildHash.update(file).update(source.replace(/\r\n?/g, '\n'));
}
const fingerprint = buildHash.digest('hex');
const outputFile = 'js/vendor/react-iztro-chart.js';

await build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    sourcemap: true,
    target: ['es2020'],
    define: {
        'process.env.NODE_ENV': '"production"'
    },
    banner: {
        js: `/* build-sha256:${fingerprint} */`,
        css: `/* build-sha256:${fingerprint} */`
    },
    // Licenses are preserved in THIRD_PARTY_NOTICES.md and scripts/licenses/.
    // Omitting bundled legal comments also keeps generated output whitespace-clean.
    legalComments: 'none',
    outfile: outputFile
});
