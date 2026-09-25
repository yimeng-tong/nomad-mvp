import { AuthFault } from '../auth/errors.js';
export type IngestExecutionPolicy = Readonly<{ enabled: boolean; isolated: boolean; leaseMs: number; pollMs: number; concurrency: number; stepTimeoutMs:number }>;
export function resolveIngestExecutionPolicy(env: Record<string,string|undefined>): IngestExecutionPolicy {
  const mode=env.INGEST_WORKER_MODE ?? 'disabled', isolation=env.INGEST_RECOVERY_ISOLATED ?? 'true';
  if (!['enabled','disabled'].includes(mode)||!['true','false'].includes(isolation)) throw new AuthFault('INGEST_WORKER_CONFIGURATION_INVALID',503);
  const integer=(name:string,fallback:number,min:number,max:number)=>{
    const raw=env[name]; if(raw===undefined)return fallback;
    if(typeof raw!=='string'||!/^[1-9][0-9]{0,8}$/.test(raw)||raw.includes('\n')||raw.includes('\r'))throw new AuthFault('INGEST_WORKER_CONFIGURATION_INVALID',503);
    const value=Number(raw);if(!Number.isSafeInteger(value)||value<min||value>max)throw new AuthFault('INGEST_WORKER_CONFIGURATION_INVALID',503);return value;
  };
  const isolated=isolation==='true';
  return Object.freeze({enabled:mode==='enabled'&&!isolated,isolated,leaseMs:integer('INGEST_LEASE_MS',30000,1000,300000),
    pollMs:integer('INGEST_POLL_MS',1000,100,30000),concurrency:integer('INGEST_CONCURRENCY',2,1,16),stepTimeoutMs:integer('INGEST_STEP_TIMEOUT_MS',30000,100,300000)});
}
