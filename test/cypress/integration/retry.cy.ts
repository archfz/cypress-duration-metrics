/// <reference types="cypress" />

context('Retries', () => {
  beforeEach(() => {
    cy.visit('https://example.cypress.io/commands/actions')
  })

  let failed = 0;

  it('fails once', () => {
    if (failed === 2) {
      // https://on.cypress.io/type
      cy.get('.action-email')
    } else {
      failed++;
      cy.get('breaking', {timeout: 2});
    }
  })
})
