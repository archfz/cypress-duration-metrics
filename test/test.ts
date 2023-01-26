import test from 'ava';
import {commandBase, logLastRun, runTest} from "./utils.js";

test.afterEach(function (t) {
  if (!t.passed) {
    logLastRun();
  }
});

test('Should generate metrics output.', t => {
  t.timeout(10000);

  return runTest(commandBase([], []), (_: any, stdout: string) => {
    console.log(stdout);
    t.pass();
  })
});

export {}
