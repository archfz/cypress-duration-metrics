# Cypress duration metrics [![Downloads](https://badgen.net/npm/dw/cypress-duration-metrics)](https://www.npmjs.com/package/cypress-duration-metrics) [![Version](https://badgen.net/npm/v/cypress-duration-metrics)](https://www.npmjs.com/package/cypress-duration-metrics)

<div align="center">

• [Install](#install)
• [Preprocessor duration](#preprocessor-duration)
• [Metrics explained](#metrics-explained)
• [Release Notes](#release-notes)

</div>

Plugin for cypress for measuring total duration of the different commands and some
stages of the `cypress run` lifecycle.

![demo](https://raw.githubusercontent.com/archfz/cypress-duration-metrics/master/demo.png)

> NOTE: Some stage totals and their labels are based on certain assumptions that might not 
> be correct. These should improve over time as more insight is gained.

> NOTE: Metrics are displayed properly only on `cypress run`. This plugin is meant for
> measuring performance on pipelines.

## Install

### Requirements

- requires cypress `>=10.0.0`

1. Install npm package.
    ```bash
    npm i --save-dev cypress-duration-metrics
    ```
2. If using typescript and es6 imports ensure `esModuleInterop` is enabled.
3. Register the output plugin in `cypress.config.{js|ts}`
    ```js
    import { registerDurationMetricsPlugin } from 'src/plugin';
   
    export default defineConfig({
      e2e: {
        setupNodeEvents(on, config) {
          registerDurationMetricsPlugin(on);
        }
      }
    });
    ```
4. Register the collector support in `cypress/support/e2e.{js|ts}`
    ```js
    import { registerDurationMetricsSupport } from 'src/support';
    registerDurationMetricsSupport();
    ```

## Preprocessor duration

Tracking preprocessor time is currently only supported if you are using custom preprocessor.
If you are using the builtin default one of cypress it won't work. To enable the measurement
you need to warp your preprocessor callback. 

The tracking should work with any kind of [preprocessor](https://docs.cypress.io/api/plugins/preprocessors-api), 
but the example below uses webpack. Your plugin file should look something like this:

```js
import {registerDurationMetricsPlugin} from 'src/plugin';

export default defineConfig({
   e2e: {
      setupNodeEvents(on, config) {
         const {measurePreprocessorDuration} = registerDurationMetricsPlugin(on);
         // .. webpackProcessor initiated here
         on('file:preprocessor', measurePreprocessorDuration(webpackProcessor));
      }
   }
});
```

## Metrics explained

#### `Total exec time`

Time spent between `the plugins require time` and `after:run` dispatch. 
This is the current best approximation of the absolute total duration of the command. 
But it is not entirely correct, as there is still time that can be spent by cypress before loading 
in the plugin and after `after:run` on shutdown.

#### `Total run time`

Time spent between `before:run` and `after:run` dispatch.

#### `Cypress boot time`

This is the difference between `Total exec time` and `Total run time`. Current assumption is that
this time is taken up by cypress to prepare everything to start the run, like plugins, events 
and servers.

#### `Specs`

Total time spent on each spec. A specs time is measured between `before:spec` and `after:spec` 
dispatches.

#### `Between specs`

Total time spent in-between specs. This measurement is always 0 when there is only 1 spec in the
whole run. The time is measure between `after:spec` of previous and `before:spec` of current test. 

#### `Browser boot time`

This is the equivalent of (`Total run time` - `Between specs` - `Specs`). The current assumption
is that this time is spent on actually opening the browser. But most likely there are other things
here.

#### `File preprocessor`

The total time spent on compiling your spec files and the support file. The count on this metric
should be equal to the number of specs + 1 for the support file (e2e.js).

#### `Tracked cy commands`

This is the total time spent on executing cypress commands.

#### `cy.*`

Total duration for a specific command. All runs of the command are measured and added together. 
You can see also the average duration for the command, the max duration and also how many times 
it was run.

## Release Notes

#### 0.1.2

- Fix esm loader compatibility for cypress.

#### 0.1.1

- Fix missing js files in publish.

#### 0.1.0

- Initial release.
