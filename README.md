# 🌌 Desktop Pet Explainer — Nova AI Companion

A cross-platform desktop cyber-companion that lives transparently on your screen and explains copied text anywhere on request.

---

## ✨ Features

- **Animated Cyber-Pet (Nova)**: Expressive animated SVG character with interactive idle, confirm, thinking, talking, and sleeping states.
- **Click & Drag Anywhere**: Click and drag Nova, the control bar, or the summon orb to reposition the companion anywhere across your screen.
- **Editable Selected Text**: When summoned (`Alt+Shift+E` / `Cmd+Shift+E`), review and edit the copied text inside an interactive `<textarea>` before generating an explanation.
- **Pinned Open Explanations**: Explanations stay open until you explicitly close them — never auto-closing mid-reading.
- **Follow-Up Chat**: Ask follow-up questions right inside the explanation bubble.
- **Out-of-the-Box Frontend Simulation**: Runs immediately without needing API keys or a backend server.
- **Multi-Provider AI Backend (`backend/`)**: Supports Google Gemini Free Tier (`gemini/gemini-2.5-flash`), Anthropic Claude, OpenAI, and local LiteLLM models when connected.

---

## 🚀 Quick Start (Start Using Immediately!)

### 1. Run the Desktop Companion
```bash
cd frontend
npm install
npm run dev
```

### 2. How to Use
- **Summon via Hotkey**: Select any text on your computer and press `Alt+Shift+E` (or `Cmd+Shift+E` on macOS).
- **Summon via UI**: Or click **Test Explain** in the top float bar or click Nova directly.
- **Reposition**: Click & drag Nova or the top control bar anywhere on your desktop.

---

## 📦 Building Standalone Application (.dmg / .exe)

To build a standalone installer for macOS or Windows:
```bash
cd frontend
npm run dist
```
The packaged installers will be generated inside `frontend/release/`.
