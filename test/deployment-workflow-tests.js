const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github/workflows/deploy-cloudflare-pages.yml');
const assetsIgnorePath = path.join(root, '.assetsignore');

assert.ok(fs.existsSync(workflowPath), 'Cloudflare Pages GitHub Actions workflow must exist');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/, 'main pushes must trigger deployment');
assert.match(workflow, /workflow_dispatch:/, 'manual reruns must be supported');
assert.match(workflow, /npm ci/);
assert.match(workflow, /npm test/);
assert.match(workflow, /npm run build:ziwei-chart/);
assert.match(workflow, /actions\/setup-node@v7/, 'the workflow must use the Node 24-compatible setup-node runtime');
assert.match(workflow, /cloudflare\/wrangler-action@v3/);
assert.match(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
assert.match(workflow, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
assert.match(workflow, /pages deploy \.\s+--project-name=/);
assert.match(workflow, /--branch=main/);
assert.match(workflow, /exit 1/, 'missing Cloudflare credentials must fail instead of reporting a false success');
assert.doesNotMatch(workflow, /if:\s*steps\.cloudflare\.outputs\.ready/, 'deployment must run after the credential check succeeds');

assert.ok(fs.existsSync(assetsIgnorePath), 'deployment asset exclusions must exist');
const assetsIgnore = fs.readFileSync(assetsIgnorePath, 'utf8');
for (const requiredPattern of ['node_modules/', '.git/', '.github/', 'test/', 'docs/', 'scripts/']) {
    assert.ok(assetsIgnore.includes(requiredPattern), `.assetsignore must exclude ${requiredPattern}`);
}

console.log('PASS Cloudflare Pages GitHub Actions deployment contract');
