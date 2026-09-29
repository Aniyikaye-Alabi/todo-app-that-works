describe('Tasks', () => {
  beforeEach(() => {
    cy.visitApp();
    cy.createList('Sprint', 2);
  });

  it('adds tasks up to the list limit', () => {
    cy.addTask('First', 50);
    cy.addTask('Second', 25);
    cy.get('[data-testid="task-row"]').should('have.length', 2);
    cy.get('[data-testid="add-task"]').should('be.disabled');
    cy.contains('TASK LIMIT REACHED').should('be.visible');
  });

  it('previews the focus plan while choosing a duration', () => {
    cy.get('[data-testid="add-task"]').click();
    cy.get('input[name="durationMinutes"]').clear().type('60');
    cy.get('[data-testid="plan-summary"]').should('contain.text', '3 focus rounds');
    cy.get('.phase-strip__seg').should('have.length', 5); // F25 B5 F25 B5 F10
  });

  it('completes, edits and removes a task', () => {
    cy.addTask('Write docs', 25);
    cy.get('[data-testid="task-row"]').within(() =>
      cy.get('input[type="checkbox"]').check({ force: true }),
    );
    cy.get('[data-testid="task-row"]').should('have.class', 'is-done');

    cy.get('button[aria-label="Edit Write docs"]').click();
    cy.get('input[name="title"]').clear().type('Write better docs');
    cy.contains('button', /save task/i).click();
    cy.contains('Write better docs').should('exist');

    cy.get('button[aria-label="Delete Write better docs"]').click();
    cy.get('[data-testid="confirm-dialog"]').within(() =>
      cy.contains('button', /remove task/i).click(),
    );
    cy.get('[data-testid="task-row"]').should('not.exist');
    cy.get('[data-testid="add-task"]').should('not.be.disabled');
  });

  it('reorders tasks with the keyboard', () => {
    cy.addTask('Alpha');
    cy.addTask('Bravo');
    cy.get('button[aria-label="Reorder Alpha"]').focus().type(' ');
    cy.focused().type('{downArrow}');
    cy.focused().type(' ');
    cy.get('[data-testid="task-row"]').first().should('contain.text', 'Bravo');
  });
});
