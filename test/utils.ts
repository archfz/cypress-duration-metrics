import {exec} from 'child_process';
import chalk from 'chalk';

let commandPrefix = 'node ./node_modules/.bin/cypress';

if (process.platform === 'win32') {
  commandPrefix = 'npx cypress';
}

export const PADDING = '                    ';

export const commandBase = (env = [], specs = []) =>
  `${commandPrefix} run --env "${env.join(',')}" --headless --config video=false -s ${specs.map(s => `cypress/integration/${s}`)}`;

let lastRunOutput = '';
let lastRunCommand = '';
export const logLastRun = () => {
  console.log(chalk.yellow('-- Cypress output start --\n\n'));
  console.log(lastRunOutput);
  console.log(chalk.yellow('-- Cypress output end --'));
  console.log(`Command: ${lastRunCommand}`);
  console.log(lastRunCommand);
};

export const runTest = async (command: string, callback: (error: any, stdout: string, stderr: string) => void) => {
  return new Promise<void>(resolve => {
    exec(command, {encoding: "UTF-8", env: {...process.env, NO_COLOR: 1}}, (error: any, stdout: Buffer, stderr: Buffer) => {
      if (stderr) {
        console.error(stderr);
      }

      let from = stdout.indexOf('Running:  ');
      let to = stdout.lastIndexOf('(Results)');
      if (from !== -1 && to !== -1) {
        stdout = stdout.slice(from, to);
      }

      lastRunOutput = stdout;
      lastRunCommand = command;
      // Normalize line endings for unix.
      const normalizedStdout = stdout.replace(/\r\n/g, "\n");
      callback(error, normalizedStdout, stderr);
      expect(normalizedStdout).to.not.contain("CypressError: `cy.task('cypress_duration_metrics__collect')` failed");

      resolve();
    });
  });
};

