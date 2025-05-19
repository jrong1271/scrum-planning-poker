# Scrum Planner

A real-time planning poker application built with Vue 3, TypeScript, and Socket.IO. This application helps agile teams conduct efficient planning poker sessions remotely.

## 🚀 Features

- Real-time card selection and score sharing
- Host controls for managing the game
- Participant management
- Score visibility toggle
- Room sharing functionality
- Modern UI with Vuetify components
- Responsive design for all devices
- Real-time synchronization across all participants

## 🛠️ Tech Stack

- **Frontend Framework:** Vue 3 with Composition API
- **Language:** TypeScript
- **UI Framework:** Vuetify 3
- **State Management:** Pinia
- **Routing:** Vue Router
- **Real-time Communication:** Socket.IO
- **Build Tool:** Vite
- **Package Manager:** npm/pnpm

## 📋 Prerequisites

- Node.js (version specified in .nvmrc)
- npm or pnpm
- Modern web browser

## 🚀 Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/scrum-planner.git
cd scrum-planner
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

## 🛠️ Development

```bash
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

## 📁 Project Structure

```
src/
├── assets/        # Static assets (images, styles)
├── components/    # Reusable Vue components
├── stores/        # Pinia stores for state management
├── views/         # Page components
├── router/        # Vue Router configuration
├── utils/         # Utility functions
└── types/         # TypeScript type definitions
```

## 🔌 Socket Events

### Room Management

- `create-room`: Create a new planning room
- `join-room`: Join an existing room
- `leave-room`: Leave the current room

### Game Actions

- `select-card`: Select a planning card
- `restart-game`: Reset all card selections
- `score-change`: Update when a participant selects a card

## 🔒 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=your_api_url
VITE_SOCKET_URL=your_socket_url
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- Vuetify team for the beautiful UI components
- Socket.IO team for the real-time capabilities

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/scrum-planner/issues) in the GitHub repository.
