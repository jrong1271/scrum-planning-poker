describe('Scrum Planner Room Host/Participant UI', () => {
  it('Host should not appear in participants list', () => {
    // Visit the home page
    cy.visit('http://localhost:5173/')

    // Simulate entering a name and creating a room
    cy.get('input[placeholder="Your name"]').type('joe')
    cy.contains('Create Room').click()

    // Wait for redirect to room
    cy.url().should('include', '/room/')

    // Host should appear in the Host section
    cy.get('.host-section').should('contain', 'joe')

    // Host should NOT appear in the Participants section
    cy.get('.participants-section').should('not.contain', 'joe')
  })
})
