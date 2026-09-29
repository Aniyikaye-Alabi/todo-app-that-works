describe('Lists', () => {
  beforeEach(() => cy.visitApp());

  it('shows the empty board', () => {
    cy.get('[data-testid="board-empty"]').should('contain.text', 'NO LISTS ON THE BOOKS');
  });

  it('validates the list form', () => {
    cy.contains('button', /new list/i).click();
    cy.get('input[name="name"]').clear();
    cy.get('input[name="taskLimit"]').clear().type('0');
    cy.contains('button', /create list/i).click();
    cy.contains('[ERR] NAME REQUIRED').should('be.visible');
    cy.contains('[ERR] BETWEEN 1 AND 100').should('be.visible');
  });

  it('creates a list and enters it', () => {
    cy.createList('Launch week', 3);
    cy.get('[data-testid="list-title"]').should('contain.text', 'Launch week');
    cy.contains('button', /board/i).click();
    cy.get('[data-testid="list-card"]').should('have.length', 1);
    cy.get('[data-testid="list-capacity"]').should('have.text', '0/3');
  });

  it('edits a list', () => {
    cy.createList('Old name');
    cy.get('button[aria-label="Edit list"]').click();
    cy.get('input[name="name"]').clear().type('New name');
    cy.contains('button', /save list/i).click();
    cy.get('[data-testid="list-title"]').should('contain.text', 'New name');
  });

  it('warns before deleting a list and its tasks', () => {
    cy.visitApp([
      {
        name: 'Doomed',
        tasks: [
          { title: 'A', durationMinutes: 25 },
          { title: 'B', durationMinutes: 25 },
        ],
      },
    ]);
    cy.get('button[aria-label="Delete list Doomed"]').click();
    cy.get('[data-testid="confirm-dialog"]')
      .should('contain.text', 'removes every task added to it (2 tasks)')
      .within(() => cy.contains('button', /cancel/i).click());
    cy.get('[data-testid="list-card"]').should('have.length', 1);

    cy.get('button[aria-label="Delete list Doomed"]').click();
    cy.get('[data-testid="confirm-dialog"]').within(() =>
      cy.contains('button', /remove list/i).click(),
    );
    cy.get('[data-testid="board-empty"]').should('exist');
    cy.window().then((win) => {
      const saved = JSON.parse(win.localStorage.getItem('sheriff:v1') ?? '{}');
      expect(saved.state.lists).to.have.length(0);
      expect(saved.state.tasks).to.deep.equal({});
    });
  });

  it('persists lists across reloads', () => {
    cy.createList('Survives reload');
    cy.reload();
    cy.contains('Survives reload').should('exist');
  });
});
