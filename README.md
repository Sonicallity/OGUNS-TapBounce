# Whirlybird PHP

A single-folder PHP version of Whirlybird with a browser game and leaderboard API.

## Structure

- `index.php` — game frontend
- `api.php` — leaderboard API
- `styles.css` — game styles
- `script.js` — browser game logic
- `scores.json` — stored leaderboard entries

## Setup

1. Open PowerShell in `c:\Users\samue\Desktop\Whirlybird`
2. Start the built-in PHP server:
   - `php -S localhost:8000`
3. Open `http://localhost:8000` in your browser.

## API

- Health: `http://localhost:8000/api.php?action=health`
- Scores GET: `http://localhost:8000/api.php?action=scores`
- Scores POST: `http://localhost:8000/api.php?action=scores`

## Notes

- Click, tap, or press Space to jump.
- Use the overlay button or Enter to start and restart.
- Submit your score after game over.
- The leaderboard keeps the top 10 scores.
