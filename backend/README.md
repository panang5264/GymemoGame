# Gymemo Backend

Express.js + MongoDB API server for Gymemo game.

## Setup
```bash
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get logged-in user profile (Protected)

### Scores
- `POST /api/scores` - Submit new session score (Protected)
- `GET /api/scores/leaderboard` - Get top user scores
- `GET /api/scores/my-scores` - Get logged-in user history (Protected)

### Progression & Sync
- `GET /api/progression/sync` - Fetch saved progress data (Protected)
- `POST /api/progression/sync` - Overwrite saved progress data (Protected)
- `GET /api/progression/:guestId` - Get village progression
- `POST /api/progression/complete` - Mark a village sublevel complete
- `POST /api/progression/unlock` - Consume a key to unlock next village

### Analytics & Profile
- `POST /api/analysis/record` - Record detailed metrics from minigame
- `GET /api/analysis/profile/:guestId` - Get cognitive profile, including `weeklyAverages`
- `GET /api/analysis/history/:guestId?startDate=&endDate=` - Fetch historical game records

### Daily Challenges
- `GET /api/daily/status/:guestId` - Check today's completion status
- `POST /api/daily/complete-mode` - Log a daily minigame (management, calculation, spatial)
- `POST /api/daily/claim-reward` - Claim completion reward

## Security
- **Global Rate Limiting**: 500 requests per 15 minutes per IP.
- **Strict Rate Limiting**: `POST /api/scores` and `POST /api/analysis/record` are limited to 50 requests per 5 minutes per IP to prevent spam.