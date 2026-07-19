const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github/workflows/deploy-cloudflare-pages.yml');
const assetsIgnorePath = path.join(root, '.assetsignore');

assert.ok(fs.existsSync(workflowPath), 'Cloudflare Pages GitHub Actions workflow must exist');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/, 'main pushes must trigger deployment');
assert.match(workflow, /workflow_dispatch:/, 'manual reruns must be supported');
assert.match(workflow, /environment:\s*cloudflare/, 'the deploy job must use the cloudflare environment secrets');
assert.match(workflow, /npm ci/);
assert.match(workflow, /npm test/);
assert.match(workflow, /npm run build:ziwei-chart/);
assert.match(workflow, /actions\/setup-node@v7/, 'the workflow must use the Node 24-compatible setup-node runtime');
assert.doesNotMatch(workflow, /cloudflare\/wrangler-action@v3/, 'deprecated action runtime must not be used');
assert.match(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
assert.match(workflow, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
assert.match(workflow, /pages deploy \.\s+--project-name=/);
assert.match(workflow, /--branch=main/);
assert.match(workflow, /pages project list --json/);
assert.match(workflow, /pages project create/);
assert.match(workflow, /cloudflare-pages-project-exists\.mjs/);
assert.match(workflow, /exit 1/, 'missing Cloudflare credentials must fail instead of reporting a false success');
assert.doesNotMatch(workflow, /if:\s*steps\.cloudflare\.outputs\.ready/, 'deployment must run after the credential check succeeds');

assert.ok(fs.existsSync(assetsIgnorePath), 'deployment asset exclusions must exist');
const assetsIgnore = fs.readFileSync(assetsIgnorePath, 'utf8');
for (const requiredPattern of ['node_modules/', '.git/', '.github/', 'test/', 'docs/', 'scripts/']) {
    assert.ok(assetsIgnore.includes(requiredPattern), `.assetsignore must exclude ${requiredPattern}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.match(packageJson.devDependencies?.wrangler || '', /^4\./, 'Wrangler 4 must be pinned in devDependencies');

const projectCheckScript = path.join(root, 'scripts', 'cloudflare-pages-project-exists.mjs');
function checkProject(projectsJson) {
    return spawnSync(process.execPath, [projectCheckScript], {
        input: projectsJson,
        encoding: 'utf8',
        env: { ...process.env, CLOUDFLARE_PAGES_PROJECT: 'cyber-fortune' }
    });
}

const existingProject = checkProject(JSON.stringify([
    { 'Project Name': 'cyber-fortune', 'Git Provider': 'No' }
]));
assert.strictEqual(existingProject.status, 0, existingProject.stderr);

const absentProject = checkProject(JSON.stringify([
    { 'Project Name': 'another-project', 'Git Provider': 'No' }
]));
assert.strictEqual(absentProject.status, 1, absentProject.stderr);

const malformedProjectList = checkProject('{not-json');
assert.strictEqual(malformedProjectList.status, 2, 'malformed project JSON must fail closed');

const malformedProjectEntries = checkProject(JSON.stringify([{ name: 'cyber-fortune' }]));
assert.strictEqual(malformedProjectEntries.status, 2, 'project entries without Wrangler fields must fail closed');

console.log('PASS Cloudflare Pages GitHub Actions deployment contract');
