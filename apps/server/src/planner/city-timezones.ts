const CITY_TIMEZONES: Readonly<Record<string, string>> = {
  厦门: 'Asia/Shanghai',
  泉州: 'Asia/Shanghai',
  福州: 'Asia/Shanghai',
  杭州: 'Asia/Shanghai',
  宁波: 'Asia/Shanghai',
  上海: 'Asia/Shanghai',
  北京: 'Asia/Shanghai',
  天津: 'Asia/Shanghai',
  广州: 'Asia/Shanghai',
  深圳: 'Asia/Shanghai',
  珠海: 'Asia/Shanghai',
  汕头: 'Asia/Shanghai',
  潮州: 'Asia/Shanghai',
  成都: 'Asia/Shanghai',
  重庆: 'Asia/Shanghai',
  西安: 'Asia/Shanghai',
  南京: 'Asia/Shanghai',
  苏州: 'Asia/Shanghai',
  无锡: 'Asia/Shanghai',
  青岛: 'Asia/Shanghai',
  济南: 'Asia/Shanghai',
  武汉: 'Asia/Shanghai',
  长沙: 'Asia/Shanghai',
  郑州: 'Asia/Shanghai',
  合肥: 'Asia/Shanghai',
  南昌: 'Asia/Shanghai',
  石家庄: 'Asia/Shanghai',
  太原: 'Asia/Shanghai',
  沈阳: 'Asia/Shanghai',
  大连: 'Asia/Shanghai',
  长春: 'Asia/Shanghai',
  哈尔滨: 'Asia/Shanghai',
  三亚: 'Asia/Shanghai',
  昆明: 'Asia/Shanghai',
  大理: 'Asia/Shanghai',
  丽江: 'Asia/Shanghai',
  西双版纳: 'Asia/Shanghai',
  贵阳: 'Asia/Shanghai',
  南宁: 'Asia/Shanghai',
  桂林: 'Asia/Shanghai',
  拉萨: 'Asia/Shanghai',
  乌鲁木齐: 'Asia/Shanghai',
  兰州: 'Asia/Shanghai',
  银川: 'Asia/Shanghai',
  西宁: 'Asia/Shanghai',
  香港: 'Asia/Hong_Kong',
  澳门: 'Asia/Macau',
  台北: 'Asia/Taipei',
  Tokyo: 'Asia/Tokyo',
  东京: 'Asia/Tokyo',
  Seoul: 'Asia/Seoul',
  首尔: 'Asia/Seoul',
  Paris: 'Europe/Paris',
  巴黎: 'Europe/Paris',
  London: 'Europe/London',
  伦敦: 'Europe/London',
  'New York': 'America/New_York',
  纽约: 'America/New_York',
};

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export class UnsupportedPlannerCityError extends Error {
  constructor(readonly city: string) {
    super(`PLANNER_CITY_TIMEZONE_UNKNOWN:${city}`);
    this.name = 'UnsupportedPlannerCityError';
  }
}

export function resolveCityTimezone(city: string) {
  const configured = process.env.PLANNER_DEFAULT_TIMEZONE?.trim();
  const timezone = CITY_TIMEZONES[city.trim()] ?? configured;
  if (!timezone || !validTimezone(timezone)) {
    throw new UnsupportedPlannerCityError(city);
  }
  return timezone;
}
