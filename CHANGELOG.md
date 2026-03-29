# Changelog

All notable changes to CloudScale Crash Recovery are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.6.21] - 2026-03-29
### Added
- Unified Log Viewer: Copy to Clipboard button in the terminal header copies all currently visible (filtered) entries as plain text.
- Unified Log Viewer: Clear button truncates writable server-side log files (watchdog log, debug.log) via AJAX with a confirmation prompt. System-owned logs (Apache, Nginx) are skipped if not writable by PHP.
- 404 Colour Scheme: Preview 404 button now passes the currently selected (unsaved) palette as a query parameter so the preview reflects the active swatch without requiring a save first.
### Fixed
- Log entries with no parseable timestamp (stack traces, HTML fragments) were always shown regardless of age due to `$ts === 0` bypass. They are now treated as continuations of their preceding timestamped anchor line and filtered together with it, preventing weeks-old log noise from appearing in the 24-hour view.

## [1.6.17] - 2026-03-27
### Added
- 404 Colour Scheme: expanded from 6 to 12 built-in palettes.
- Leaderboard: top-10 displayed on canvas welcome screen for every 404 Olympics game.
- Asteroids added as game 5 in the 404 Olympics.
### Changed
- 404 page heading moved to top of layout.
- Decorative graphic removed for cleaner page.
- Jetpack game: reduced gravity (0.32 → 0.22), bigger gap, gentler physics, slower speed ramp.
- Racer game: eased difficulty.
- Scores capped at 999,999; 6-digit display supported.
### Fixed
- Leaderboard deduplication (JS + PHP).
- Home button, mobile scroll trap, and score cheat protection.
- Per-game score caps and IP rate-limiting to block inflated leaderboard entries.
- Always sync localStorage with server leaderboard, even when server response is empty.
- Added mtime cache-busting to custom-404.css and custom-404.js asset URLs.

## [1.6.0] - 2026-03-20
### Added
- 404 Olympics: replaced single Runner game with a multi-game hub — Runner, Jetpack, Racer, Snake, and Asteroids, each with independent per-game high scores.
- Per-game high scores persisted server-side via REST API.

## [1.5.2] - 2026-03-17
### Fixed
- PCP compliance fixes.
- Cast `$lines` to int before shell interpolation (MEDIUM security hardening).

## [1.5.0] - 2026-03-16
### Added
- Custom 404 page: opt-in toggle (Settings tab) replaces the default WordPress 404 response with a self-contained branded page — no theme dependency.
- 404 page displays the site logo (falls back to site icon), site name, and tagline for branded identity.
- 404 Runner mini-game on the 404 page: canvas-based side-scroller (Space or tap to jump over 404 blocks), with high score tracking and increasing speed. Includes `roundRect` polyfill for Safari <15.4.
- PHP CLI and curl binary path fallbacks for FPM environments where `PHP_BINARY` points to php-fpm and `which` returns empty due to restricted `PATH`.
- Settings tab in admin UI with a toggle switch for the custom 404 feature.
### Changed
- 404 page background changed from dark navy to baby blue gradient.
- Description text enlarged and bolded for better readability.
- 404 page body changed from `overflow:hidden` to `overflow-x:hidden` so the page scrolls to reveal the game.

## [1.4.7] - 2026-03-13
### Fixed
- Tab hash persistence: JS valid-tab list now matches actual `data-tab` attribute values (`checks`, `setup`).
- Modal overlay now dismisses correctly on outside click.
- Local time display for debug-mode revert timestamp uses `toLocaleTimeString` in the browser.
### Added
- Live wp-config.php writability check via AJAX on Logs tab activation — never stale.
### Changed
- Asset version strings append file mtime to `CS_PCR_VERSION` so Cloudflare cache busts on every deploy without a manual purge.

## [1.4.2] - 2025-04-01
### Added
- Logs & Debug tab: unified log viewer aggregating watchdog, WordPress debug.log, PHP error log, and Apache/Nginx error logs filtered to the last 24 hours.
- WordPress debug-mode toggle: enables `WP_DEBUG` / `WP_DEBUG_LOG` for exactly 30 minutes with dual-revert safety net (WP-Cron + system cron one-shot script).
- Auto-countdown timer displayed while debug mode is active.
- Filter log entries by source, severity level, and free-text search.
- Auto-refresh log viewer toggle (30-second interval).
### Fixed
- Debug-mode countdown now re-calculates from correct server timestamp.
- Cache purge step added to deploy workflow.

## [1.2.0] - 2025-02-01
### Added
- System cron watchdog: probes the site every minute via `curl`; on failure identifies and removes the most recently modified plugin within the 10-minute crash window.
- Compatibility Checks tab: 10 server-side checks (PHP CLI, `shell_exec`, `curl`, probe endpoint, plugin-dir permissions, WP-CLI, watchdog script, cron entry, log file, legacy WP cron).
- Status & Log tab: watchdog deployment status, last recovery action, last alert, log tail.
- WP-CLI integration: watchdog deactivates the culprit plugin via WP-CLI before deletion.
- Probe endpoint: responds with `CLOUDSCALE_OK` on healthy load.
