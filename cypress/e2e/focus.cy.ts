const MIN = 60_000;

describe('Focus session', () => {
  beforeEach(() => {
    cy.clock(Date.UTC(2026, 8, 15, 9, 0, 0));
    cy.visitApp([{ name: 'Deep work', tasks: [{ title: 'Refactor store', durationMinutes: 30 }] }]);
    cy.contains('button', /enter/i).click();
  });

  it('runs 25 min focus, 5 min break, then the remaining 5 min and finishes', () => {
    cy.get('button[aria-label="Start focus on Refactor store"]').click();
    cy.get('[data-testid="focus-session"]').should('contain.text', 'Focus round 1 of 2');
    cy.get('[data-testid="focus-clock"]').should('have.text', '25:00');

    cy.tick(25 * MIN);
    cy.get('[data-testid="focus-session"]').should('contain.text', 'Break · 5 min');
    cy.get('[data-testid="focus-clock"]').should('have.text', '05:00');

    cy.tick(5 * MIN);
    cy.get('[data-testid="focus-session"]').should('contain.text', 'Focus round 2 of 2');
    cy.get('[data-testid="focus-clock"]').should('have.text', '05:00');

    cy.tick(5 * MIN);
    cy.get('[data-testid="focus-session"]').should('contain.text', 'Duration exhausted');
    cy.contains('button', /mark task complete/i).click();
    cy.get('[data-testid="task-row"]')
      .should('have.class', 'is-done')
      .and('contain.text', '30M / 30M');
  });

  it('pauses and resumes with the space bar', () => {
    cy.get('button[aria-label="Start focus on Refactor store"]').click();
    cy.tick(1 * MIN);
    cy.get('body').type(' ');
    cy.contains('PAUSED').should('be.visible');
    cy.tick(10 * MIN);
    cy.get('[data-testid="focus-clock"]').should('have.text', '24:00');
    cy.get('body').type(' ');
    cy.contains('button', /pause/i).should('be.visible');
  });

  it('minimises to the status bar and keeps running', () => {
    cy.get('button[aria-label="Start focus on Refactor store"]').click();
    cy.get('body').type('{esc}');
    cy.get('[data-testid="focus-session"]').should('not.exist');
    cy.tick(2 * MIN);
    cy.get('[data-testid="focus-chip"]').should('contain.text', 'FOCUS 23:00').click();
    cy.get('[data-testid="focus-session"]').should('exist');
  });

  it('abandoning logs the minutes served', () => {
    cy.get('button[aria-label="Start focus on Refactor store"]').click();
    cy.tick(10 * MIN);
    cy.contains('button', /abandon/i).click();
    cy.get('[data-testid="task-row"]').should('contain.text', '10M / 30M');
  });
});
