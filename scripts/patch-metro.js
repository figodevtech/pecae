#!/usr/bin/env node
/**
 * patch-metro.js
 * Applies ESM export patches to metro packages for Node 20+ compatibility.
 * Runs automatically via `postinstall` script in root package.json.
 *
 * Root cause: metro 0.83.x/0.84.x uses internal subpath imports that are not
 * listed in their package.json "exports" field. Node 20.19+ enforces strict
 * exports resolution, causing ERR_PACKAGE_PATH_NOT_EXPORTED at runtime.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const patches = [
  {
    pkg: 'metro-cache',
    additions: {
      './src/stores/FileStore': './src/stores/FileStore.js',
      './*': './*',
    },
  },
  {
    pkg: 'metro-transform-worker',
    additions: {
      './src/utils/getMinifier': './src/utils/getMinifier.js',
      './*': './*',
    },
  },
  {
    pkg: 'metro-resolver',
    additions: {
      './*': './*',
    },
  },
  {
    pkg: 'metro',
    additions: {
      './*': './*',
    },
  },
];

let patched = 0;

for (const { pkg, additions } of patches) {
  const pkgJsonPath = path.join(ROOT, 'node_modules', pkg, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    console.log(`⚠️  ${pkg}: not found, skipping.`);
    continue;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

  if (!pkgJson.exports) {
    console.log(`⚠️  ${pkg}: no "exports" field, skipping.`);
    continue;
  }

  let changed = false;
  for (const [key, value] of Object.entries(additions)) {
    if (!pkgJson.exports[key]) {
      pkgJson.exports[key] = value;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(`✅  ${pkg}: patched.`);
    patched++;
  } else {
    console.log(`✔️   ${pkg}: already patched.`);
  }
}

console.log(`\n🔧 patch-metro: ${patched} package(s) patched.\n`);

// --- Prisma Client generation ---
const prismaSchemaPath = path.join(ROOT, 'apps', 'api', 'prisma', 'schema.prisma');
if (fs.existsSync(prismaSchemaPath)) {
  console.log('🔄 Generating Prisma Client...');
  try {
    require('child_process').execSync('npx prisma generate', {
      cwd: path.join(ROOT, 'apps', 'api'),
      stdio: 'inherit',
    });
    console.log('✅ Prisma Client generated.\n');
  } catch {
    console.log('⚠️  Prisma generate failed (non-blocking).\n');
  }
}
