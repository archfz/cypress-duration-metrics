import {registerDurationMetricsSupport} from "../../../support";

registerDurationMetricsSupport();

Cypress.Commands.add('someLongCommandWhichWouldNotFitRight', () => {
  cy.log('ran');
})
