# Scrum Planning Poker

A real-time planning poker application built with Vue 3 and Socket.IO.

## Features

- Create and join planning poker rooms
- Real-time card selection and voting
- Host controls for managing tasks and rounds
- Beautiful and responsive UI
- Support for standard planning poker card values

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

## Development

1. Start the backend server:

   ```bash
   cd server
   npm run dev
   ```

2. In a new terminal, start the frontend development server:

   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Click "Create New Room" to start a new planning session
2. Share the room URL with your team members
3. The first person to join becomes the host
4. Host can:
   - Set the current task and description
   - Reveal all cards
   - Start a new round
5. Team members can:
   - Select their story point estimates
   - See the current task
   - View revealed results

## Technologies Used

- Vue 3 with Composition API
- TypeScript
- Socket.IO for real-time communication
- Vue Router for navigation
- Pinia for state management
