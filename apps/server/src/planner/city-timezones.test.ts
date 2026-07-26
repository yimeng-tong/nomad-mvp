import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveCityTimezone,
  UnsupportedPlannerCityError,
} from './city-timezones.js';

describe('planner city timezone resolution', () => {
  it('uses explicit IANA zones and rejects unknown cities', () => {
    assert.equal(resolveCityTimezone('厦门'), 'Asia/Shanghai');
    assert.equal(resolveCityTimezone('泉州'), 'Asia/Shanghai');
    assert.equal(resolveCityTimezone('巴黎'), 'Europe/Paris');
    assert.throws(
      () => resolveCityTimezone('未知测试城市'),
      (error) =>
        error instanceof UnsupportedPlannerCityError &&
        error.city === '未知测试城市' &&
        error.message === 'PLANNER_CITY_TIMEZONE_UNKNOWN:未知测试城市',
    );
  });
});
