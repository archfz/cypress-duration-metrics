"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDurationMetricsPlugin = void 0;
const chalk_1 = require("chalk");
const PLUGIN_REQUIRE_TIME = Date.now();
const initMetric = () => ({ total: 0, max: 0, count: 0 });
const registerOnMetric = (total, metric) => {
    metric.total += total;
    metric.max = Math.max(metric.max || 0, total);
    metric.count = (metric.count || 0) + 1;
};
const padStr = (str, space, pos, sideSpace = 0) => {
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
const logTableLine = (str, separators = true, colorize = (str) => str) => {
    const sep = separators ? chalk_1.default.grey('|') : ' ';
    console.log(`  ${sep} ` + colorize(str) + ' '.repeat(95 - str.length) + sep);
};
const logMetricLine = (title, metric, runTotal) => {
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
const logUnmeasuredLine = (title) => {
    let str = padStr(title, 36, "right")
        + padStr('(not measuring, see README.md)', 50, "right", 5);
    logTableLine(str);
};
const logTableHeader = () => {
    console.log(chalk_1.default.bold(`  (${chalk_1.default.underline('Duration aggregates')})`)
        + ' ' + chalk_1.default.grey('cypress-duration-metrics'));
    console.log('');
    logTableLine(padStr('Type', 36, "right")
        + padStr('Total', 12, "left")
        + padStr('Total pct', 12, "left")
        + padStr('Max', 12, "left")
        + padStr('Avg', 12, "left")
        + padStr('Count', 5, "right", 4), false, chalk_1.default.grey);
    console.log(chalk_1.default.grey('  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐'));
};
const logTableSeparator = () => {
    console.log(chalk_1.default.grey('  |────────────────────────────────────────────────────────────────────────────────────────────────|'));
};
const logTableFooter = () => {
    console.log(chalk_1.default.grey('  └────────────────────────────────────────────────────────────────────────────────────────────────┘'));
    console.log('');
};
const registerDurationMetricsPlugin = (on) => {
    let runStartTime;
    let firstSpecTime;
    let specStartTime;
    let specEndTime;
    const commandMetric = {};
    const preprocessorMetric = initMetric();
    const betweenSpecMetric = initMetric();
    const specMetric = initMetric();
    let measuringPreprocessDuration = false;
    on('before:run', () => {
        runStartTime = Date.now();
    });
    on('after:run', () => {
        const grandTotal = Date.now() - PLUGIN_REQUIRE_TIME;
        const runTotal = Date.now() - runStartTime;
        const browserBootTime = runTotal - (betweenSpecMetric.total + specMetric.total);
        let commandsTotal = 0;
        logTableHeader();
        Object.entries(commandMetric)
            .sort(([, a], [, b]) => a.total - b.total)
            .forEach(([command, metric]) => {
            logMetricLine(`cy.${command}`, metric, grandTotal);
            commandsTotal += metric.total;
        });
        logTableSeparator();
        logMetricLine('Tracked cy commands', { total: commandsTotal }, grandTotal);
        if (measuringPreprocessDuration) {
            logMetricLine('File preprocessor', preprocessorMetric, grandTotal);
        }
        else {
            logUnmeasuredLine('File preprocessor');
        }
        logTableSeparator();
        logMetricLine('Specs', specMetric, grandTotal);
        logMetricLine('Between specs', betweenSpecMetric, grandTotal);
        logMetricLine('Browser boot time', { total: browserBootTime }, grandTotal);
        logTableSeparator();
        logMetricLine('Total run time', { total: runTotal }, grandTotal);
        logMetricLine('Cypress boot time', { total: runStartTime - PLUGIN_REQUIRE_TIME }, grandTotal);
        logTableSeparator();
        logMetricLine('Total exec time', { total: grandTotal }, grandTotal);
        logTableFooter();
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
        cypress_duration_metrics__collect: (commandMetrics) => {
            commandMetrics.forEach(metric => {
                commandMetric[metric.command] = commandMetric[metric.command] || initMetric();
                registerOnMetric(metric.total, commandMetric[metric.command]);
            });
        },
    });
    return {
        measurePreprocessorDuration(callback) {
            measuringPreprocessDuration = true;
            return (...args) => {
                const startTime = Date.now();
                return callback(...args).then((results) => {
                    registerOnMetric(Date.now() - startTime, preprocessorMetric);
                    return results;
                });
            };
        }
    };
};
exports.registerDurationMetricsPlugin = registerDurationMetricsPlugin;
//# sourceMappingURL=plugin.js.map