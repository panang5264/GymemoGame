# Gymemo Backend

Express.js + MongoDB API server for Gymemo game.

## Setup
```bash
npm install
npm run dev
```

## API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/user/:userId` - Get user data
- `POST /api/game/start` - Start game (use key)
- `POST /api/game/complete` - Save game result
- `GET /api/leaderboard` - Get leaderboard