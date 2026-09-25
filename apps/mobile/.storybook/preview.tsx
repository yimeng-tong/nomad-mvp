import type { Preview } from '@storybook/react-vite';
import { mswLoader } from 'msw-storybook-addon/csf3';
import { activeScenario, beginScenario, finishScenario, startWorker } from '../workbench/scenario';
import { createHandlers, scenarioName } from '../workbench/handlers';
import '../src/styles.css';
import '../src/platform/app-host.css';
import '../workbench/workbench.css';

const loadMsw = mswLoader(startWorker);
const preview: Preview = {
  loaders: [async (context) => {
    const scene = await beginScenario(context.id);
    context.parameters.msw = { handlers: createHandlers(location.origin, scenarioName(context.parameters.workbenchScenario), scene.controller.signal) };
    return loadMsw(context);
  }],
  beforeEach: () => {
    const scene = activeScenario();
    return () => finishScenario(scene);
  },
  afterEach: () => activeScenario().ledger.assertClean(),
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
};
export default preview;
