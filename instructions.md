# ⚡ Gemini Flash Pro: Complete System Manual

Welcome to the **Gemini Flash Pro** documentation. This platform is a high-performance, aesthetically-driven neural interface powered by Google’s Gemini Flash 3.0. It integrates real-time cloud synchronization, iterative game development, and a strict administrative hierarchy.

---

## 🛰️ 1. System Access & Identity

### **Neural Signatures (Authentication)**
- **Registration**: Users create a unique "Signature" (Username) and "Access Key" (Password).
- **Persistence**: Your identity is stored across sessions via LocalStorage and synchronized with the Firebase Cloud Grid.
- **Banning**: Admins can terminate a unit's link. Banned users are immediately disconnected and blocked from re-entry.

---

## 👑 2. Sovereign Hierarchy (The Power Map)

The grid operates on a strict three-tier authorization structure:

### **Tier 0: Root Authority (`@Maintenance`)**
- **The Creator**: This is the only unit with absolute sovereignty.
- **Promotion Protocol**: Only the unit with the exact username `@Maintenance` can see the "Grant Admin" button in the Grid Master Matrix.
- **Stealth**: `@Maintenance` is scrubbed from all public User Directories.

### **Tier 1: Admin Units**
- **Capabilities**:
    - **Direct Messaging**: Use the `@Message` command to inject text into any user's terminal.
    - **Intercom**: Broadcast `@Admin` messages globally.
    - **Grid Master Matrix**: Access the panel to Ban users, Grant Premium, or deploy Tactical Hijacks (Pranks).
    - **Surveillance**: View live signal traces (recent messages) of any user.

### **Tier 2: Premium Citizens**
- **Capabilities**:
    - **Pro Models**: Access to `Gemini 3 Pro` for advanced reasoning.
    - **Expanded Atmosphere**: Higher limits for Background Blur (60px) and Density (100%).
    - **Neural Thinking**: Control over "Thinking Tokens" (up to 24,000) for deeper model processing.

### **Tier 3: Standard Units**
- Access to `Gemini 3 Flash` and `Gemini 2.5 Lite`.
- Standard UI customization.
- Access to Game Forge and Live Voice.

---

## ⌨️ 3. The Command Matrix (Terminal Commands)

Commands are typed directly into the main chat input:

| Command | Permission | Effect |
| :--- | :--- | :--- |
| `@Message` | **Admin** | A window pops up with all the users except @Maintanance so could text each other just like in IMessages. |
| `@Admin [text]` | **Admin** | Broadcasts a red alert banner to all active units on the grid. |
| `@Maintenance` | **Public** | Any mention of the root unit is intercepted and blocked by the system firewall. |

---

## 🛠️ 4. Core Interfaces

### **A. Neural Chat (The Terminal)**
- **Streaming**: Responses are delivered via real-time packet streaming.
- **Personas**: Switch between "Code Architect", "Cyberpunk Narrator", "Fun n Simple", etc., to modify the model's core logic.
- **Cloud Sync**: Chats are saved per user and synced across all devices.

### **B. Game Forge v2.0 (The Dev Studio)**
- **Iterative Logic**: The Forge maintains a persistent "Project History". You can refine your game over multiple messages (e.g., "Add a jump button" -> "Now make the background red").
- **Persistence**: Games are saved to your account. You can have multiple projects running simultaneously.
- **Real-time Preview**: Code is instantly compiled and rendered in the side-pane iframe.

### **C. Live Voice (Neural Link)**
- **Modality**: Purely audio interaction using Gemini 2.5 Flash Native Audio.
- **Status Indicators**:
    - `Listening`: System is capturing your audio.
    - `Speaking`: Gemini is generating a raw PCM audio stream.
- **Interruption**: Speak over the model to stop its current output and start a new turn.

---

## 🕹️ 5. Grid Master Matrix (Admin Tools)

Accessible only to Admins via the "Admin Matrix" button:
- **Neural Ghost Injector**: A UI-based alternative to `@Message`. Deliver direct payloads to users.
- **Tactical Hijackers**:
    - **Rickroll**: Forces a persistent 10-second visual takeover of the user's screen with the classic breach meme.
    - **Stickbug**: A green-tinted tactical visual breach.
- **Surveillance**: Click any user signature to view their active packet history.

---

## 🎨 6. Atmosphere & Aesthetics

- **Presets**: Choose from Neon City, Deep Space, or Nature Mist.
- **Blur & Density**: Adjust the "Physicality" of the background. Premium users can create complete glassmorphism effects.
- **Theme**: Toggle between "Dark Mode" (High Contrast) and "Light Mode" (Clean Interface).

---

## 🏗️ 7. Technical Infrastructure

### **The Backend (Firebase)**
- **Firestore**: Manages the `neural_users`, `neural_chats`, `neural_games`, and `neural_overrides` collections.
- **Overrides**: This is how Admins "push" changes to users (Pranks/DMs) in real-time.

### **The Intelligence (Gemini API)**
- **API Key**: Must be provided via `process.env.API_KEY`. 
- **Models**:
    - `gemini-3-flash-preview`: Daily driver.
    - `gemini-3-pro-preview`: Logic specialist.
    - `gemini-2.5-flash-native-audio-preview-12-2025`: Voice Specialist.

### **Hosting Requirements**
- Requires an environment variable named `API_KEY`.
- Works on Vercel, Netlify, or any modern SPA host.

---

## ⚠️ 8. Security Protocols
- **Root Protection**: No user, including other Admins, can ban or demote `@Maintenance`.
- **Encryption**: DMs are injected directly into the user's local state via the `RemoteOverride` observer.
- **Firewall**: Direct mentions of system-reserved keywords are filtered to prevent social engineering.

---
*Document Version: 3.2.0 | Security Clearance: Level 4 Required*