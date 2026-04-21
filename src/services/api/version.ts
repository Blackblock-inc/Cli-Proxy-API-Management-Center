import { apiClient } from './client';

export interface VersionSnapshotResponse {
  'raw-version'?: string;
  'display-version'?: string;
  'baseline-version'?: string;
  'uv-version'?: string;
}

export interface LatestVersionResponse {
  repository?: string;
  'release-page'?: string;
  'management-source'?: string;
  'install-supported'?: boolean;
  'update-available'?: boolean;
  'install-note'?: string;
  'asset-name'?: string;
  current?: VersionSnapshotResponse;
  latest?: VersionSnapshotResponse;
  'current-version'?: string;
  'latest-version'?: string;
}

export interface InstallUpdateResponse {
  status?: string;
  'latest-version'?: string;
  'current-version'?: string;
  repository?: string;
  'release-page'?: string;
  'restart-required'?: boolean;
}

export const versionApi = {
  checkLatest: () => apiClient.get<LatestVersionResponse>('/latest-version'),
  installLatest: () => apiClient.post<InstallUpdateResponse>('/install-update'),
};
