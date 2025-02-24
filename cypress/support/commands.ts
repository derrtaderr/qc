/// <reference types="cypress" />

// Add any custom commands here
Cypress.Commands.add('dragAndDrop', { prevSubject: 'element' }, (subject, options) => {
  cy.wrap(subject).trigger('dragenter', options)
  cy.wrap(subject).trigger('dragover', options)
  cy.wrap(subject).trigger('drop', options)
}) 