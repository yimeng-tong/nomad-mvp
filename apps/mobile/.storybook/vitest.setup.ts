import { afterEach } from 'vitest';
import { finishScenario } from '../workbench/scenario';

afterEach(async () => { await finishScenario(); });
