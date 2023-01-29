import {CommandMetric, initMetric, mergeMetrics, Metric, registerOnMetric} from "./common";

const chalk = require("chalk");

const RUNNING_TIME = Math.floor(process.uptime() * 1000);
const PLUGIN_REQUIRE_TIME = Date.now();
const NODE_START_TIME = PLUGIN_REQUIRE_TIME - RUNNING_TIME;

const padStr = (str: string, space: number, pos: 'left' | 'right', sideSpace: number = 0) => {
  const needed = space - str.length;
  const padStr = ' '.repeat(needed < 0 ? 0 : needed);
  const sidePadStr = ' '.repeat(sideSpace);

  if (needed < 0) {
    str = str.substring(0, space - 2) + '..';
  }

  return pos === 'left'
    ? padStr + str + sidePadStr
    : sidePadStr + str + padStr;
};

const logTableLine = (str: string, separators: boolean = true, colorize: (str: string) => any = (str) => str) => {
  const sep = separators ? chalk.grey('|') : ' ';
  console.log(`  ${sep} ` + colorize(str) + ' '.repeat(95 - str.length) + sep)
}

const logMetricLine = (title: string, metric: Metric, runTotal: number) => {
  let str = padStr(title, 36, "right")
    + padStr((metric.total / 1000).toFixed(2) + 's', 12, "left")
    + padStr((Math.round(metric.total / runTotal * 10000) / 100).toFixed(2) + '%', 12, "left");

  if (metric.max !== undefined) {
    str += padStr((metric.max / 1000).toFixed(3) + 's', 12, 'left');
  }
  if (metric.count !== undefined) {
    const avg = metric.count ? metric.total / metric.count / 1000 : 0;
    str += padStr(avg.toFixed(3) + 's', 12, 'left');
    str += padStr(metric.count.toString(), 5, 'right', 4);
  }

  logTableLine(str);
};

const logUnmeasuredLine = (title: string) => {
  let str = padStr(title, 36, "right")
   + padStr('(not measuring, see README.md)', 50, "right", 5);

  logTableLine(str);
}

const logTableHeader = () => {
  console.log(chalk.bold(`  (${chalk.underline('Duration aggregates')})`)
    + ' ' + chalk.grey('cypress-duration-metrics'))
  console.log('');
  logTableLine(
    padStr('Type', 36, "right")
    + padStr('Total', 12, "left")
    + padStr('Total pct', 12, "left")
    + padStr('Max', 12, "left")
    + padStr('Avg', 12, "left")
    + padStr('Count', 5, "right", 4),
    false,
    chalk.grey
  )
  console.log(chalk.grey('  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐'));
}

const logTableSeparator = () => {
  console.log(chalk.grey('  |────────────────────────────────────────────────────────────────────────────────────────────────|'));
}

const logTableFooter = () => {
  console.log(chalk.grey('  └────────────────────────────────────────────────────────────────────────────────────────────────┘'));
  console.log('');
}

const registerDurationMetricsPlugin = (on: Cypress.PluginEvents) => {
  let runStartTime: number;
  let firstSpecTime: number;
  let specStartTime: number;
  let specEndTime: number;

  const commandMetric: Record<string, Metric> = {};
  const preprocessorMetric: Metric = initMetric();
  const betweenSpecMetric: Metric = initMetric();
  const betweenTestMetric: Metric = initMetric();
  const betweenCommandMetric: Metric = initMetric();
  const specMetric: Metric = initMetric();
  const retriesMetric: Metric = initMetric();

  let measuringPreprocessDuration = false;

  on('before:run', () => {
    runStartTime = Date.now();
  });

  on('after:run', () => {
    const grandTotal = Date.now() - NODE_START_TIME;
    const runTotal = Date.now() - runStartTime;
    const browserBootTime = runTotal - (betweenSpecMetric.total + specMetric.total);
    let commandsTotal = 0;

    logTableHeader();

    Object.entries(commandMetric)
      .sort(([,a],[,b]) => a.total - b.total)
      .forEach(([command, metric]) => {
        logMetricLine(`cy.${command}`, metric, grandTotal);
        commandsTotal += metric.total;
      });

    logTableSeparator();
    logMetricLine('Tracked cy commands', {total: commandsTotal}, grandTotal);
    logMetricLine('Between commands', betweenCommandMetric, grandTotal);
    logMetricLine('Between tests', betweenTestMetric, grandTotal);
    if (measuringPreprocessDuration) {
      logMetricLine('File preprocessor', preprocessorMetric, grandTotal);
    } else {
      logUnmeasuredLine('File preprocessor')
    }
    logTableSeparator();
    logMetricLine('Specs', specMetric, grandTotal);
    logMetricLine('Between specs', betweenSpecMetric, grandTotal);
    logMetricLine('Browser boot time', {total: browserBootTime}, grandTotal);
    logTableSeparator();
    logMetricLine('Total run time', {total: runTotal}, grandTotal);
    logMetricLine('Cypress boot time', {total: runStartTime - NODE_START_TIME}, grandTotal);
    logTableSeparator();
    logMetricLine('Test retries', retriesMetric, grandTotal);
    logMetricLine('Total exec time', {total: grandTotal}, grandTotal);

    logTableFooter();

    console.log(chalk.grey('    Details on metrics at https://github.com/archfz/cypress-duration-metrics#metrics-explained'));
  });

  on('before:spec', () => {
    firstSpecTime = firstSpecTime || Date.now();
    specStartTime = Date.now();

    if (specEndTime) {
      registerOnMetric(specStartTime - specEndTime, betweenSpecMetric);
    }
  });

  on('after:spec', () => {
    specEndTime = Date.now();
    registerOnMetric(specEndTime - specStartTime, specMetric);
  });

  on('task', {
    cypress_duration_metrics__collect: (commandMetrics: CommandMetric[]) => {
      commandMetrics.forEach(metric => {
        commandMetric[metric.command] = commandMetric[metric.command] || initMetric();
        registerOnMetric(metric.total, commandMetric[metric.command]);
      })
    },
    cypress_duration_metrics__collect_retries: (total: number) => {
      registerOnMetric(total, retriesMetric);
    },
    cypress_duration_metrics__collect_test_between: (total: number) => {
      registerOnMetric(total, betweenTestMetric);
    },
    cypress_duration_metrics__collect_command_between: (metric: Metric) => {
      mergeMetrics(metric, betweenCommandMetric);
    }
  });

  return {
    measurePreprocessorDuration(callback: (...args: any[]) => any) {
      measuringPreprocessDuration = true;

      return (...args: any[]) => {
        const startTime = Date.now();
        return callback(...args).then((results: any) => {
          registerOnMetric(Date.now() - startTime, preprocessorMetric);
          return results;
        })
      };
    }
  }
};

export = registerDurationMetricsPlugin;
