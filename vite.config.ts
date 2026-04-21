import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import fs from 'fs';

const gitDescribePattern = /^(.+)-\d+-g[0-9a-f]+(?:-dirty)?$/i;
const DEFAULT_WEBUI_BASELINE_VERSION = process.env.CPA_UV_WEBUI_BASELINE_VERSION || '1.7.41';

// Get version from environment, git tag, or package.json
function runGitCommand(args: string[]): string {
  const result = spawnSync('git', args, {
    cwd: __dirname,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

function getVersion(): string {
  // 1. Environment variable (set by GitHub Actions)
  if (process.env.VERSION) {
    return process.env.VERSION;
  }

  // 2. Try git tag
  const gitTag =
    runGitCommand(['describe', '--tags', '--exact-match']) ||
    runGitCommand(['describe', '--tags']);
  if (gitTag) {
    return gitTag;
  }

  // 3. Fall back to package.json version
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
    if (pkg.version && pkg.version !== '0.0.0') {
      return pkg.version;
    }
  } catch {
    // package.json not readable
  }

  return 'dev';
}

function formatVersion(rawVersion: string): string {
  const raw = normalizeVersionSource(rawVersion);
  if (!raw || raw === 'dev') {
    return raw || 'dev';
  }

  const displayMatch = raw.match(/^(\d+(?:\.\d+){2})-UV\s*\((\d+(?:\.\d+)*)\)$/i);
  if (displayMatch) {
    return `${displayMatch[1]}-UV (${normalizeUvVersion(displayMatch[2])})`;
  }

  const baselineMatch = raw.match(/^v?(\d+(?:\.\d+){2})(?:[-_.]?uv[-_.]?(\d+(?:[-_.]\d+)*))?$/i);
  if (baselineMatch) {
    let baselineVersion = baselineMatch[1];
    let uvVersion = normalizeUvVersion(baselineMatch[2] || '');
    if (baselineVersion !== DEFAULT_WEBUI_BASELINE_VERSION) {
      if (uvVersion) {
        baselineVersion = DEFAULT_WEBUI_BASELINE_VERSION;
      } else {
        uvVersion = normalizeUvVersion(baselineVersion);
        baselineVersion = DEFAULT_WEBUI_BASELINE_VERSION;
      }
    } else if (!uvVersion) {
      uvVersion = '1.0.0';
    }
    return `${baselineVersion}-UV (${uvVersion})`;
  }

  const uvOnlyMatch = raw.match(/^v?(\d+(?:\.\d+){0,2})$/i);
  if (uvOnlyMatch) {
    return `${DEFAULT_WEBUI_BASELINE_VERSION}-UV (${normalizeUvVersion(uvOnlyMatch[1])})`;
  }

  return raw;
}

function normalizeVersionSource(rawVersion: string): string {
  let value = String(rawVersion || '').trim();
  if (!value) {
    return '';
  }

  const describeMatch = value.match(gitDescribePattern);
  if (describeMatch) {
    value = describeMatch[1];
  }

  return value.replace(/-dirty$/i, '').trim();
}

function normalizeUvVersion(rawVersion: string): string {
  const parts = rawVersion
    .trim()
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((segment) => Number.parseInt(segment, 10))
    .filter((segment) => Number.isFinite(segment));

  if (!parts.length) {
    return '';
  }

  while (parts.length < 3) {
    parts.push(0);
  }

  return parts.join('.');
}

function emitManagementHtml() {
  return {
    name: 'emit-management-html',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexPath = path.join(distDir, 'index.html');
      const managementPath = path.join(distDir, 'management.html');
      const hashPath = path.join(distDir, 'management.html.sha256.txt');

      if (!fs.existsSync(indexPath)) {
        return;
      }

      const html = fs.readFileSync(indexPath);
      fs.writeFileSync(managementPath, html);
      const sha256 = createHash('sha256').update(html).digest('hex').toUpperCase();
      fs.writeFileSync(hashPath, `${sha256}  management.html\n`, 'utf8');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({
      removeViteModuleLoader: true
    }),
    emitManagementHtml()
  ],
  define: {
    __APP_VERSION__: JSON.stringify(formatVersion(getVersion()))
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`
      }
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  }
});
