/// <reference types="cypress" />

const STORAGE_KEY = 'sheriff:v1';

interface SeedList {
  name: string;
  taskLimit?: number;
  tasks?: { title: string; durationMinutes: number }[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Visits the app with the boot screen skipped, sound off, and optional seed data. */
      visitApp(seed?: SeedList[]): Chainable<void>;
      /** Creates a list through the UI. */
      createList(name: string, taskLimit?: number): Chainable<void>;
      /** Adds a task to the open list through the UI. */
      addTask(title: string, durationMinutes?: number): Chainable<void>;
    }
  }
}

Cypress.Commands.add('visitApp', (seed: SeedList[] = []) => {
  const lists: unknown[] = [];
  const tasks: Record<string, unknown> = {};
  seed.forEach((l, li) => {
    const taskIds: string[] = [];
    (l.tasks ?? []).forEach((t, ti) => {
      const id = `task_${li}_${ti}`;
      taskIds.push(id);
      tasks[id] = {
        id,
        listId: `list_${li}`,
        title: t.title,
        notes: '',
        priority: 'med',
        durationMinutes: t.durationMinutes,
        focusedMinutes: 0,
        completed: false,
        completedAt: null,
        createdAt: 0,
      };
    });
    lists.push({
      id: `list_${li}`,
      name: l.name,
      description: '',
      startDate: '2026-01-01',
      endDate: '2030-12-31',
      taskLimit: l.taskLimit ?? 10,
      taskIds,
      createdAt: 0,
    });
  });

  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.clear();
      win.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          state: { lists, tasks, settings: { theme: 'phosphor', soundOn: false, bootSeen: true } },
          version: 1,
        }),
      );
    },
  });
  // Wait for React to mount (and global hotkeys to register) before interacting.
  cy.get('#main').should('exist');
});

Cypress.Commands.add('createList', (name: string, taskLimit = 5) => {
  cy.contains('button', /new list/i).click();
  cy.get('[data-testid="list-form"]').within(() => {
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="taskLimit"]').clear().type(String(taskLimit));
    cy.contains('button', /create list/i).click();
  });
});

Cypress.Commands.add('addTask', (title: string, durationMinutes = 25) => {
  cy.get('[data-testid="add-task"]').click();
  cy.get('[data-testid="task-form"]').within(() => {
    cy.get('input[name="title"]').type(title);
    cy.get('input[name="durationMinutes"]').clear().type(String(durationMinutes));
    cy.contains('button', /add task/i).click();
  });
});

export {};
