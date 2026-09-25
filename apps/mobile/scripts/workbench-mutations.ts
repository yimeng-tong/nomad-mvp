import type { Plugin } from 'vite';

type Mutation = { file: string; before: string; after: string };
const sentinel = 'nomad-private-sentinel-94';
const playAnchor = "const trigger = canvas.getByRole('button', { name: '打开灵感说明' });";
const caught = (code: string) => `try { ${code} } catch { /* deliberate component catch */ }\n${playAnchor}`;
const mutations: Record<string, Mutation[]> = {
  focus: [{ file: 'src/home/HomeSheet.tsx', before: 'if (previous?.isConnected) previous.focus();', after: 'if (previous?.isConnected) node?.focus();' }],
  keyboard: [{ file: 'src/home/HomeSheet.tsx', before: "if (event.key === 'Escape')", after: "if (event.key === 'NeverEscape')" }],
  association: [{ file: 'src/auth/LoginScreen.tsx', before: "aria-describedby={notice ? 'login-notice' : undefined}", after: 'aria-describedby={undefined}' }],
  text: [{ file: 'src/auth/LoginScreen.tsx', before: "if (status === 403) return '当前登录方式暂不可用';", after: "if (status === 403) return '';" }],
  axe: [{ file: 'src/home/HomeSheet.tsx', before: '{children}', after: '<button type="button" />{children}' }],
  undeclared: [{ file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: caught(`await fetch('/undeclared?q=${sentinel}', {method:'POST', body:'${sentinel}'});`) }],
  late: [
    { file: 'workbench/HomeSheet.stories.tsx', before: "import { activeScenario, sceneFetch } from './scenario';", after: "import { activeScenario, sceneFetch, beginScenario, scenarioClient } from './scenario';" },
    { file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: `const previous = activeScenario(); const client = scenarioClient(previous); await beginScenario('replacement');\n` + caught('await client.getConfig();') },
  ],
  workerLost: [{ file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: caught("const registration = await navigator.serviceWorker.getRegistration('/'); await registration?.unregister(); await fetch(activeScenario().baseUrl + '/auth/config');") }],
  passthrough: [{ file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: caught("await fetch(activeScenario().baseUrl + '/auth/config', {headers:{Accept:'msw/passthrough'}});") }],
  staticFetch: [{ file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: caught(`await fetch('/assets/customer.json?private=${sentinel}');`) }],
  stopped: [
    { file: 'workbench/HomeSheet.stories.tsx', before: "import { activeScenario, sceneFetch } from './scenario';", after: "import { activeScenario, sceneFetch, stopMocking } from './scenario';" },
    { file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: caught("stopMocking(); await fetch(activeScenario().baseUrl + '/auth/config');") },
  ],
  stoppedDuringLookup: [
    { file: 'workbench/HomeSheet.stories.tsx', before: "import { activeScenario, sceneFetch } from './scenario';", after: "import { activeScenario, sceneFetch, stopMocking } from './scenario';" },
    { file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: caught("const pending = fetch(activeScenario().baseUrl + '/auth/config'); stopMocking(); await pending;") },
  ],
  rawAfterClose: [
    { file: 'workbench/HomeSheet.stories.tsx', before: "import { activeScenario, sceneFetch } from './scenario';", after: "import { activeScenario, sceneFetch, finishScenario } from './scenario';" },
    { file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: `const url = activeScenario().baseUrl + '/auth/config'; await finishScenario();\n` + caught('await fetch(url);') },
  ],
  rawPrevious: [
    { file: 'workbench/HomeSheet.stories.tsx', before: "import { activeScenario, sceneFetch } from './scenario';", after: "import { activeScenario, sceneFetch, beginScenario } from './scenario';" },
    { file: 'workbench/HomeSheet.stories.tsx', before: playAnchor, after: `const url = activeScenario().baseUrl + '/auth/config'; await beginScenario('next');\n` + caught('await fetch(url);') },
  ],
  provider: [{ file: 'workbench/fixtures.ts', before: "provider: 'fixture', mode: 'risk'", after: "provider: 'aliyun-pnvs', mode: 'risk'" }],
  workerMissing: [{ file: 'workbench/scenario.ts', before: "url: '/mockServiceWorker.js'", after: "url: '/wrong-worker.js'" }],
};

/** Controlled in-memory defects use the real runner/config/components without modifying workspace source. */
export function workbenchMutation(): Plugin[] {
  const name = process.env.NOMAD_WORKBENCH_MUTATION;
  if (!name) return [];
  if (!Object.hasOwn(mutations, name)) throw new Error('WORKBENCH_MUTATION_UNKNOWN');
  return [{ name: 'nomad-workbench-counterexample', enforce: 'pre', transform(source, id) {
    let code = source;
    for (const change of mutations[name]) if (id.split('?')[0].replaceAll('\\', '/').endsWith(`/${change.file}`)) {
      if (!code.includes(change.before)) throw new Error('WORKBENCH_MUTATION_ANCHOR_MISSING');
      code = code.replace(change.before, change.after);
    }
    return code === source ? undefined : { code, map: null };
  } }];
}
