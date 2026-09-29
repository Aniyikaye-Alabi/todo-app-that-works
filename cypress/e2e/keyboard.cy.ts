describe('Keyboard & command palette', () => {
  beforeEach(() => cy.visitApp([{ name: 'Inbox' }]));

  it('opens the palette with Ctrl+K and jumps to a list', () => {
    cy.get('body').type('{ctrl}k');
    cy.get('[cmdk-input]').type('Inbox');
    cy.get('[cmdk-input]').type('{enter}');
    cy.get('[data-testid="list-title"]').should('contain.text', 'Inbox');
  });

  it('N opens the new-list form on the board and the new-task form inside a list', () => {
    cy.get('body').type('n');
    cy.get('[data-testid="list-form"]').should('exist');
    cy.get('body').type('{esc}');
    cy.contains('button', /enter/i).click();
    cy.get('body').type('n');
    cy.get('[data-testid="task-form"]').should('exist');
  });

  it('switches theme from the palette', () => {
    cy.get('body').type('{ctrl}k');
    cy.get('[cmdk-input]').type('theme amber{enter}');
    cy.get('html').should('have.attr', 'data-theme', 'amber');
  });
});
