import registerDurationMetricsSupport from "../../../commonjs/support";

registerDurationMetricsSupport();

// @ts-ignore
Cypress.Commands.add('someLongCommandWhichWouldNotFitRight', () => {
  cy.log('ran');
})
