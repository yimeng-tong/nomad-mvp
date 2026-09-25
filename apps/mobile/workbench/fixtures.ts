import type { components } from 'nomad-types/src/api-types';

export const authConfig = {
  availability: 'fixture',
  privacy_url: '/workbench/legal/privacy',
  user_agreement_url: '/workbench/legal/terms',
  enabled_methods: [{ id: 'phone', label: '手机号', type: 'phone', enabled: true }],
  ios_equal_weight_order: ['phone'],
  captcha: { provider: 'fixture', mode: 'risk' },
} satisfies components['schemas']['AuthConfigResponse'];

export const currentUser = {
  user_id: '00000000-0000-4000-8000-000000000094',
  user: { id: '00000000-0000-4000-8000-000000000094' },
  session: {
    id: '00000000-0000-4000-8000-000000000095',
    device_id: 'workbench-synthetic',
    expires_at: '2099-01-01T00:00:00.000Z',
  },
} satisfies components['schemas']['CurrentUserResponse'];

export const otpSent = {
  sent: true, retry_after_sec: 30, captcha_required: false, captcha_provider: 'fixture',
} satisfies components['schemas']['OtpStartResponse'];

export const libraryCities = {
  cities: [{ city_id: 'city-synthetic', name: '合成城市', inspiration_count: 2, pending_count: 1 }],
  unlocated_count: 1,
} satisfies components['schemas']['LibraryCitiesResponse'];

export const partialImport = {
  ingest_id: 'workbench-job', attempt: 1, state_version: 2, state: 'failed',
  source_title: '合成图文资料', partial: true, retriable: true, stored_count: 1,
  error_code: 'INGEST_REHOST_DEGRADED', updated_at: '2026-09-25T00:00:00.000Z',
  result: { inspiration_id: 'workbench-inspiration', locate_status: 'pending', asset_count: 1, city_name: null },
  actions: { retry: true, view: true },
} satisfies components['schemas']['IngestSnapshot'];

export const blocked = {
  error_code: 'WORKBENCH_FORBIDDEN', error_message: '合成场景：当前登录方式暂不可用', retriable: false,
} satisfies components['schemas']['ErrorEnvelope'];

export function assertFixtureConfig(config: components['schemas']['AuthConfigResponse']) {
  if (config.captcha.provider !== 'fixture' || config.captcha.sdk_url || config.captcha.app_id || config.availability !== 'fixture') {
    throw new Error('WORKBENCH_REAL_PROVIDER_REJECTED');
  }
}
