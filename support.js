"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDurationMetricsSupport = void 0;
const registerDurationMetricsSupport = () => {
    let commandMetrics = {};
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
        commandMetrics[cmd.attributes.chainerId] = {
            command: cmd.attributes.name + (variant ? ` (${variant})` : ''),
            started: Date.now(),
            total: 0,
        };
    });
    Cypress.on('command:end', (cmd) => {
        const id = cmd.attributes.chainerId;
        if (commandMetrics[id]) {
            commandMetrics[id].total = Date.now() - commandMetrics[id].started;
        }
    });
    Cypress.on('test:after:run', () => {
        // @ts-ignore
        Cypress.backend('task', {
            task: 'cypress_duration_metrics__collect',
            arg: Object.values(commandMetrics),
        })
            .catch(() => { });
        commandMetrics = {};
    });
};
exports.registerDurationMetricsSupport = registerDurationMetricsSupport;
//# sourceMappingURL=support.js.map