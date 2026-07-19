import { readFileSync } from 'node:fs';

const projectName = process.env.CLOUDFLARE_PAGES_PROJECT?.trim();
if (!projectName) {
    console.error('CLOUDFLARE_PAGES_PROJECT is required.');
    process.exit(2);
}

let projects;
try {
    projects = JSON.parse(readFileSync(0, 'utf8'));
} catch {
    console.error('Wrangler returned malformed project JSON.');
    process.exit(2);
}

if (!Array.isArray(projects)) {
    console.error('Wrangler project JSON must be an array.');
    process.exit(2);
}

if (!projects.every((project) => (
    project && typeof project === 'object' && typeof project['Project Name'] === 'string'
))) {
    console.error('Wrangler project JSON contains an invalid project entry.');
    process.exit(2);
}

const exists = projects.some((project) => (
    project['Project Name'] === projectName
));
process.exit(exists ? 0 : 1);
