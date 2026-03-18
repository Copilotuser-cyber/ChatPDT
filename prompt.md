# Prompt to Replicate "Gemini Flash Pro"

Create a comprehensive, full-stack React application called "Gemini Flash Pro" that serves as an advanced AI chat interface, community hub, and experimental playground. The application should use React 19, Vite, Tailwind CSS, Firebase (for real-time database/storage), and the `@google/genai` SDK for AI interactions.

## Core Architecture & Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS (configured via CDN in `index.html` with custom animations like shake, pulse-fast, and glitch).
- **Backend/Storage:** Firebase (Firestore/Realtime DB) for user authentication, chat history, neural rooms, and app settings.
- **AI Integration:** `@google/genai` SDK for text generation, streaming responses, and live voice interactions.
- **Styling:** Dark mode by default, utilizing `Inter` and `Fira Code` fonts.

## Features & Components

### 1. Authentication & User Management (`AuthView.tsx`, `ProfileSettings.tsx`)
- Users can log in or create an account.
- Profiles include user ID, username, avatar, and roles (e.g., standard, premium, admin).
- Support for "Ghost Mode" and "God Mode" based on user roles or redeemed codes.

### 2. Main Layout & Navigation (`App.tsx`, `Sidebar.tsx`)
- A responsive sidebar for navigating between different views: Chat, Neural Rooms, Game Forge, DMs, Community, and Admin Panel.
- Global state management for active chats, rooms, visual settings (background blur, opacity, disco mode), and themes.

### 3. AI Chat Interface (`ChatWindow.tsx`, `chatService.ts`, `gemini.ts`)
- Standard chat interface with streaming responses from Gemini.
- Support for creating new chats, renaming chats, and deleting them.
- Auto-generation of chat titles based on the first message.
- Configuration options for the AI (temperature, system instructions, etc.).

### 4. Neural Rooms & Community (`NeuralRoomView.tsx`, `CommunityPage.tsx`)
- Public or private rooms where multiple users can interact.
- Real-time synchronization of messages and room states using Firebase.

### 5. Direct Messaging (`DMWindow.tsx`)
- Peer-to-peer messaging between users.

### 6. Live Voice Protocol (`LiveVoiceOverlay.tsx`)
- Integration with Gemini's Live API for real-time, low-latency voice interactions.
- An overlay UI showing active voice connection status and visualizers.

### 7. Game Forge (`GameForge.tsx`)
- An experimental section for generating or playing text-based or simple UI games powered by Gemini.

### 8. Admin & Hosting (`AdminPanel.tsx`, `HostingInfo.tsx`)
- A panel restricted to admin users to manage users, broadcast global messages, and monitor system health.

### 9. Easter Eggs & Secret Codes (in `App.tsx`)
Implement a code redemption system with the following secret codes:
- `DONT DO IT`: Toggles "Disco Mode".
- `PREMIUM_ACCESS`: Grants the user premium status.
- `GHOST_MODE`: Activates stealth mode (lowers background opacity).
- `RAINBOW_ROAD`: Toggles a rainbow visual mode.
- `GLITCH_SYSTEM`: Toggles a CSS glitch effect on the entire app.
- `NEON_DREAM`: Activates a neon gradient background.
- `SUDO_GOD`: Grants God Mode (admin privileges).

## File Structure Requirements
Ensure the following files are created and properly linked:
- `src/App.tsx`: Main state container and router.
- `src/index.tsx`: React DOM rendering.
- `src/index.html`: Contains Tailwind CDN, custom keyframes, and import maps.
- `src/types.ts`: TypeScript interfaces for `User`, `Chat`, `Message`, `NeuralRoom`, `AppSettings`, etc.
- `src/constants.ts`: Default configurations and constants.
- `src/services/storage.ts`: Firebase wrapper for subscribing to chats, rooms, and user overrides.
- `src/services/chatService.ts`: Wrapper for Gemini API calls and streaming.
- `src/services/gemini.ts`: Core Gemini API initialization.
- `src/components/*`: All UI components listed above.

## Styling Details
- Use `bg-slate-50` for light mode and `bg-slate-950` for dark mode.
- Implement custom scrollbars.
- Add CSS classes for `.glitch-mode` and `.neon-pulse-mode` that apply global visual effects when activated via secret codes.

Please build this application ensuring all components are modular, the TypeScript types are strict, and the real-time Firebase subscriptions are properly cleaned up in `useEffect` hooks.
