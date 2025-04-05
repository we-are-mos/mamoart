# 🎨 MamoArt

![Bun](https://img.shields.io/badge/Runtime-Bun-blueviolet)
![Vite](https://img.shields.io/badge/Frontend-Vite-informational)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-informational)
![License](https://img.shields.io/badge/License-Custom-lightgrey)

**MamoArt** is a full-stack Web3 painting app where NFTs come to life on a 1500-grid canvas.  
Users can paint grid tiles using NFTs from **Forma (EVM)** and **Stargaze (Cosmos)**, powered by a real-time on-chain backend and a sleek frontend interface.

---

## 🚀 Features

- 🧩 **NFT-based Painting System**  
  Users can paint tiles using supported NFTs across multiple chains.

- 🔌 **Keplr & RainbowKit Wallet Integration**  
  Seamless experience with Cosmos and EVM wallets.

- ⚡ **Real-time Gas Estimation + Visual Feedback**  
  See cost estimates before painting with updated TIA/USD values.

- 🧠 **Backend Indexer + REST/WebSocket API**  
  Tracks ownership and paint status efficiently.

- 🖼️ **Grid Visualizer**  
  Every grid is backed by chain-verified NFT data.

---

## 📦 Tech Stack

- **Frontend:** Vite + React + TypeScript  
- **Backend:** Bun + Express + WebSocket + TypeScript
- **Wallets:** RainbowKit (EVM), Keplr (Cosmos)  
- **Contracts:** Forma (EVM-compatible), Stargaze  

---

## ⚙️ Quick Start

```bash
git clone https://github.com/we-are-mos/mamoart.git
cd mamoart
```

### Backend

```bash
cd backend
bun install
bun run dev
```

### Frontend

```bash
cd frontend
bun install
bun run dev
```

> Make sure `.env` files are configured in both folders.

---

## 📁 Project Structure

```
mamoart/
├── backend/      # Express + WebSocket + Bun API server
├── frontend/     # React TS + Vite app
├── .env          # PORT, ADMIN_PRIVATE_KEY, ALLOWED_ORIGINS, PAINTING_STATUS
├── .gitignore
├── README.md
└── LICENSE
```

---

## 🔒 License

This project is licensed under a [custom license](./LICENSE).  
It is **source-available** for transparency and educational purposes only.

---

## 📬 Contact

Questions, bugs, or feature ideas?  
Reach out at **dev@mammothos.xyz** or open an issue.