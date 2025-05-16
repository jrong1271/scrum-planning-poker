# Scrum Planner

A real-time planning poker application built with Vue 3, TypeScript, and Socket.IO.

## Features

- Real-time card selection and score sharing
- Host controls for managing the game
- Participant management
- Score visibility toggle
- Room sharing functionality
- Modern UI with Vuetify components

## Tech Stack

- Vue 3 with Composition API
- TypeScript
- Vuetify 3 for UI components
- Socket.IO for real-time communication
- Pinia for state management
- Vue Router for navigation

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Project Structure

```
src/
├── components/     # Vue components
├── stores/        # Pinia stores
├── views/         # Page components
├── router/        # Vue Router configuration
└── types/         # TypeScript type definitions
```

## Socket Events

- `create-room`: Create a new planning room
- `join-room`: Join an existing room
- `leave-room`: Leave the current room
- `select-card`: Select a planning card
- `restart-game`: Reset all card selections
- `score-change`: Update when a participant selects a card

## License

MIT
