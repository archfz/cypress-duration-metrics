import {CommandMetric} from "./types";

const registerDurationMetricsSupport = () => {
  let commandMetrics: Record<string, CommandMetric> = {};

  Cypress.on('command:start', (cmd) => {
    if (['end-logGroup', 'within-restore'].includes(cmd.attributes.name)) {
      return;
    }

    let variant;
    if (cmd.attributes.name === 'wait') {
      variant = typeof cmd.attributes.args[0] === 'number'
        ? 'fixed time'
        : 'resource';
    }

    commandMetrics[cmd.attributes.id] = {
      command: cmd.attributes.name + (variant ? ` (${variant})` : ''),
      started: Date.now(),
      total: 0,
    };
  })

  Cypress.on('command:end', (cmd) => {
    const id = cmd.attributes.id;

    if (commandMetrics[id]) {
      commandMetrics[id].total = Date.now() - commandMetrics[id].started;
    }
  })

  Cypress.on('test:after:run', () => {
    // @ts-ignore
    Cypress.backend('task', {
      task: 'cypress_duration_metrics__collect',
      arg: Object.values(commandMetrics),
    })
      .catch(() => {/* noop */});
    commandMetrics = {};
  })
};

export = registerDurationMetricsSupport;
