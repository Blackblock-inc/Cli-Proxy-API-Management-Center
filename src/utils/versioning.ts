import {
  DEFAULT_SERVER_BASELINE_VERSION,
  DEFAULT_WEBUI_BASELINE_VERSION,
} from './branding';

const displayVersionPattern = /^(\d+(?:\.\d+){2})-UV\s*\((\d+(?:\.\d+)*)\)$/i;
const baselineUVVersionPattern = /^v?(\d+(?:\.\d+){2})(?:[-_.]?uv[-_.]?(\d+(?:[-_.]\d+)*))?$/i;
const uvOnlyVersionPattern = /^v?(\d+(?:\.\d+){0,2})$/i;
const gitDescribePattern = /^(.+)-\d+-g[0-9a-f]+(?:-dirty)?$/i;

type MismatchStrategy = 'baseline-as-uv' | 'preserve-uv';

interface VersionFormatOptions {
  baselineVersion: string;
  mismatchStrategy: MismatchStrategy;
  unknownDisplay?: string;
}

export interface VersionInfo {
  rawVersion: string;
  displayVersion: string;
  baselineVersion: string;
  uvVersion: string;
}

const splitNumericParts = (value: string) =>
  value
    .trim()
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((segment) => Number.parseInt(segment, 10))
    .filter((segment) => Number.isFinite(segment));

const normalizeUVVersion = (value: string) => {
  const parts = splitNumericParts(value);
  if (!parts.length) return '';
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts.join('.');
};

const normalizeVersionSource = (rawVersion?: string | null) => {
  let value = String(rawVersion ?? '').trim();
  if (!value) {
    return '';
  }

  const describeMatch = value.match(gitDescribePattern);
  if (describeMatch) {
    value = describeMatch[1];
  }

  return value.replace(/-dirty$/i, '').trim();
};

const formatVersionWithOptions = (
  rawVersion: string | null | undefined,
  options: VersionFormatOptions
): VersionInfo => {
  const raw = normalizeVersionSource(rawVersion);
  if (!raw) {
    return {
      rawVersion: '',
      displayVersion: options.unknownDisplay ?? 'Unknown',
      baselineVersion: '',
      uvVersion: '',
    };
  }

  const displayMatch = raw.match(displayVersionPattern);
  if (displayMatch) {
    const baselineVersion = displayMatch[1];
    const uvVersion = normalizeUVVersion(displayMatch[2]);
    return {
      rawVersion: raw,
      displayVersion: `${baselineVersion}-UV (${uvVersion})`,
      baselineVersion,
      uvVersion,
    };
  }

  const baselineMatch = raw.match(baselineUVVersionPattern);
  if (baselineMatch) {
    let baselineVersion = baselineMatch[1];
    let uvVersion = normalizeUVVersion(baselineMatch[2] || '');
    if (baselineVersion !== options.baselineVersion) {
      if (options.mismatchStrategy === 'preserve-uv' && uvVersion) {
        baselineVersion = options.baselineVersion;
      } else {
        uvVersion = normalizeUVVersion(baselineVersion);
        baselineVersion = options.baselineVersion;
      }
    } else if (!uvVersion) {
      uvVersion = '1.0.0';
    }

    return {
      rawVersion: raw,
      displayVersion: `${baselineVersion}-UV (${uvVersion})`,
      baselineVersion,
      uvVersion,
    };
  }

  const uvOnlyMatch = raw.match(uvOnlyVersionPattern);
  if (uvOnlyMatch) {
    const uvVersion = normalizeUVVersion(uvOnlyMatch[1]);
    return {
      rawVersion: raw,
      displayVersion: `${options.baselineVersion}-UV (${uvVersion})`,
      baselineVersion: options.baselineVersion,
      uvVersion,
    };
  }

  return {
    rawVersion: raw,
    displayVersion: raw,
    baselineVersion: '',
    uvVersion: '',
  };
};

export const formatServerVersionInfo = (rawVersion?: string | null) =>
  formatVersionWithOptions(rawVersion, {
    baselineVersion: DEFAULT_SERVER_BASELINE_VERSION,
    mismatchStrategy: 'baseline-as-uv',
  });

export const formatWebUIVersionInfo = (rawVersion?: string | null) =>
  formatVersionWithOptions(rawVersion, {
    baselineVersion: DEFAULT_WEBUI_BASELINE_VERSION,
    mismatchStrategy: 'preserve-uv',
  });

export const formatVersionInfo = formatServerVersionInfo;
