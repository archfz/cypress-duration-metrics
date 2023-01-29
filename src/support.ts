import {CommandMetric, initMetric, registerOnMetric} from "./common";

const registerDurationMetricsSupport = () => {
  let commandMetrics: Record<string, CommandMetric> = {};
  let betweenCommandsMetric = initMetric();
  let lastTestStartTime: number;
  let lastTestEndTimeInSpec: number;
  let lastCommandEndTimeInTest: number;
  let lastTestSpec: string;

  const sendBackend = (data: {task: string, arg: any}) => {
    // @ts-ignore
    Cypress.backend('task', data)
      .catch(() => {/* noop */});
  }

  Cypress.on('command:start', (cmd) => {
    if (['end-logGroup', 'within-restore'].includes(cmd.attributes.name)) {
      return;
    }

    if (lastCommandEndTimeInTest) {
      registerOnMetric(Date.now() - lastCommandEndTimeInTest, betweenCommandsMetric);
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
    lastCommandEndTimeInTest = Date.now();

    if (commandMetrics[id]) {
      commandMetrics[id].total = Date.now() - commandMetrics[id].started;
    }
  })

  Cypress.on('test:before:run', (test) => {
    if (test.currentRetry > 0) {
      lastTestStartTime = Date.now();
    } else {
      lastTestStartTime = 0;
    }

    if (test.invocationDetails && lastTestSpec != test.invocationDetails.relativeFile) {
      lastTestSpec = test.invocationDetails.relativeFile;
      lastTestEndTimeInSpec = 0;
    }

    if (lastTestEndTimeInSpec) {
      sendBackend({
        task: 'cypress_duration_metrics__collect_test_between',
        arg: Date.now() - lastTestEndTimeInSpec,
      })
    }
  })
  Cypress.on('test:after:run', () => {
    if (lastTestStartTime !== 0) {
      sendBackend({
        task: 'cypress_duration_metrics__collect_retries',
        arg: Date.now() - lastTestStartTime,
      })
    }

    sendBackend({
      task: 'cypress_duration_metrics__collect',
      arg: Object.values(commandMetrics),
    })
    sendBackend({
      task: 'cypress_duration_metrics__collect_command_between',
      arg: betweenCommandsMetric,
    })

    commandMetrics = {};
    betweenCommandsMetric = initMetric();
    lastCommandEndTimeInTest = 0;
    lastTestEndTimeInSpec = Date.now();
  });
};

export = registerDurationMetricsSupport;
