# Achievements System

A full-stack web application for managing achievements and reward points, built with React, TypeScript, Vite, and Tailwind CSS.

## Features

### Admin Panel (Back Office)
- **Achievements Management**: Create, edit, activate/deactivate, and duplicate achievements
- **Dynamic Trigger Configuration**: Support for Login Streak, Game Turnover, Game Transaction, User Verification, and Deposit triggers
- **Vertical Scope**: Configure achievements for Casino, Sportsbook, Live Casino, or Cross-Vertical
- **Advanced Filtering**: Dynamic filters based on vertical (providers, game categories, sports types, leagues, etc.)
- **User Management**: View player progress (In Progress and Completed tabs)
- **Transaction Logs**: Track all reward point transactions

### Player Front-End
- **Achievements Lobby**: Grid view of all achievements with filters (All, In Progress, Completed)
- **Achievement Details**: Detailed view with progress tracking and trigger descriptions
- **Reward Claiming**: Claim completed achievements and receive Reward Points
- **Player Wallet**: View Reward Points balance
- **Simulation Controls**: Test achievements by simulating various actions (Login, Casino Bet, Sports Bet, Deposit, Verification)

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **LocalStorage** for data persistence (mock API)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Routes

- `/` - Redirects to `/player`
- `/admin` - Admin Panel
  - `/admin/achievements` - Achievements list
  - `/admin/achievements/new` - Create new achievement
  - `/admin/achievements/edit/:id` - Edit achievement
  - `/admin/management` - User management (progress tracking)
  - `/admin/logs` - Transaction logs
- `/player` - Player Portal
  - `/player` - Achievements lobby
  - `/player/achievement/:id` - Achievement detail page
  - `/player/wallet` - Player wallet

## Data Storage

All data is stored in browser LocalStorage. The mock API layer handles:
- Achievements
- Player progress
- Transaction logs
- Player wallets

## Achievement Triggers

1. **Login Streak**: Track consecutive login days
2. **Game Turnover**: Track total turnover amount or count
3. **Game Transaction**: Track number of game transactions
4. **User Verification**: Track email, phone, or KYC verification
5. **Deposit**: Track number of deposits or deposit amounts

## Vertical Types

- **Casino**: Filter by providers, game categories, individual games
- **Sportsbook**: Filter by sport types, countries, leagues, events, market types
- **Live Casino**: Filter by providers, game types, individual games
- **Cross-Vertical**: Combine casino and sports filters

## Notes

- All achievements are lifetime (no time-boxing)
- Reward Points (RP) are the only currency
- Simulation features allow testing without real game integration
- Data persists in LocalStorage across sessions


# achievements-prototype