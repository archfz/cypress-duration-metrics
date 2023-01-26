import { defineConfig } from 'cypress';
import registerDurationMetricsPlugin from "../commonjs/plugin";

export default defineConfig({
  e2e: {
    "baseUrl": "https://example.cypress.io",
    "video": false,
    "screenshotOnRunFailure": false,
    specPattern: 'cypress/integration/**/*.cy.{js,jsx,ts,tsx}',
    async setupNodeEvents(on, config) {
      registerDurationMetricsPlugin(on);

      return config;
    }
  }
})
