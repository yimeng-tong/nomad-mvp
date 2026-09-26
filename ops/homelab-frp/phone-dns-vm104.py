#!/usr/bin/env python3
"""Inspect/create only the Nomad phone hostname in the existing AliDNS zone.

Run on VM104 with its restricted server-side provider configuration and an
isolated Alibaba Cloud DNS SDK venv. Never print credentials or full responses.
"""

import json
import os
import sys
from pathlib import Path

from alibabacloud_alidns20150109.client import Client as AliDnsClient
from alibabacloud_alidns20150109 import models as dns_models
from alibabacloud_tea_openapi import models as open_api_models

ZONE = 'yinianyunqi.top'
HOST = 'nomad-test'
DOMAIN = f'{HOST}.{ZONE}'
TARGET_IP = '47.101.189.96'
PROVIDERS = Path('/etc/nomad-mvp/development/providers.env')


def provider_value(name: str) -> str:
    for line in PROVIDERS.read_text().splitlines():
        if line.startswith(name + '='):
            value = line.split('=', 1)[1].strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                value = value[1:-1]
            if value:
                return value
    raise RuntimeError('CREDENTIAL_UNAVAILABLE')


def main() -> int:
    if os.geteuid() != 0 or sys.argv[1:] not in (['check'], ['apply']):
        return 64
    config = open_api_models.Config(
        access_key_id=provider_value('ALIBABA_CLOUD_ACCESS_KEY_ID'),
        access_key_secret=provider_value('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
    )
    config.endpoint = 'alidns.aliyuncs.com'
    client = AliDnsClient(config)
    response = client.describe_sub_domain_records(dns_models.DescribeSubDomainRecordsRequest(
        sub_domain=DOMAIN, domain_name=ZONE, page_size=500,
    ))
    body = response.body
    if body.total_count > 500:
        raise RuntimeError('DNS_RECORD_COUNT_UNEXPECTED')
    records = body.domain_records.record if body.domain_records else []
    exact = [record for record in records if record.rr == HOST and record.domain_name == ZONE]
    if not exact:
        if sys.argv[1] == 'check':
            print(json.dumps({'domain': DOMAIN, 'record': 'absent', 'changed': False}))
            return 0
        created = client.add_domain_record(dns_models.AddDomainRecordRequest(
            domain_name=ZONE, rr=HOST, type='A', value=TARGET_IP, ttl=600,
        ))
        print(json.dumps({'domain': DOMAIN, 'type': 'A', 'value': TARGET_IP,
                          'recordId': created.body.record_id, 'changed': True}))
        return 0
    if len(exact) != 1 or exact[0].type != 'A' or exact[0].value != TARGET_IP or exact[0].status.upper() != 'ENABLE':
        raise RuntimeError('DNS_EXISTING_RECORD_CONFLICT')
    print(json.dumps({'domain': DOMAIN, 'type': 'A', 'value': TARGET_IP,
                      'recordId': exact[0].record_id, 'changed': False}))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        category = str(error) if str(error) in {
            'CREDENTIAL_UNAVAILABLE', 'DNS_RECORD_COUNT_UNEXPECTED', 'DNS_EXISTING_RECORD_CONFLICT'
        } else 'DNS_API_FAILED'
        print(json.dumps({'domain': DOMAIN, 'changed': False, 'failureCategory': category,
                          'credentialsEmitted': False}))
        raise SystemExit(1)
