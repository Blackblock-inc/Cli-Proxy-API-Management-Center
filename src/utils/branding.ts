export const BRAND_ABBR = 'CPA-UV';
export const BRAND_NAME = BRAND_ABBR;
export const BRAND_EDITION = 'User Version';
export const BRAND_FULL_NAME = 'CPA WebUI';
export const BRAND_FULL_NAME_WITH_EDITION = `${BRAND_FULL_NAME} - ${BRAND_EDITION}`;

export const DEFAULT_SERVER_BASELINE_VERSION = '6.9.31';
export const DEFAULT_WEBUI_BASELINE_VERSION = '1.7.41';
export const DEFAULT_REPOSITORY_URL = 'https://github.com/Blackblock-inc/CPA-UV';

const toRepositoryUrl = (input?: string | null) => {
  const fallback = DEFAULT_REPOSITORY_URL;
  const text = String(input ?? '').trim();
  if (!text) return fallback;

  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase();
    const parts = url.pathname
      .replace(/\/+$/, '')
      .split('/')
      .filter(Boolean);

    if (host === 'github.com' && parts.length >= 2) {
      const repoName = parts[1].replace(/\.git$/i, '');
      return `https://github.com/${parts[0]}/${repoName}`;
    }

    if (host === 'api.github.com' && parts[0] === 'repos' && parts.length >= 3) {
      return `https://github.com/${parts[1]}/${parts[2]}`;
    }
  } catch {
    return fallback;
  }

  return fallback;
};

export const resolveQuickLinks = (repositoryInput?: string | null) => {
  const mainRepo = toRepositoryUrl(repositoryInput);
  return {
    mainRepo,
    managementSource: `${mainRepo}/blob/main/assets/management.html`,
    releasePage: `${mainRepo}/releases/latest`,
  } as const;
};
