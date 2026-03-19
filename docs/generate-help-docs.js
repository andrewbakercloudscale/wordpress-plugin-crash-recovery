'use strict';
const helpLib = require('/Users/cp363412/Desktop/github/shared-help-docs/help-lib.js');

helpLib.run({
    baseUrl:    process.env.WP_BASE_URL,
    cookies:    process.env.WP_COOKIES,
    restUser:   process.env.WP_REST_USER,
    restPass:   process.env.WP_REST_PASS,
    docsDir:    process.env.WP_DOCS_DIR,

    pluginName: 'CloudScale Crash Recovery',
    pluginDesc: 'A system-cron-based watchdog that probes your site every minute. If a crash is detected it automatically deactivates and deletes the most recently modified plugin, then re-probes to confirm recovery.',
    pageTitle:  'Help & Documentation — Crash Recovery',
    pageSlug:   'crash-recovery-help',
    adminUrl:   `${process.env.WP_BASE_URL}/wp-admin/tools.php?page=cloudscale-crash-recovery`,

    sections: [
        { id: 'watchdog',   label: 'Watchdog Dashboard',    file: 'panel-watchdog.png'   },
        { id: 'crash-log',  label: 'Crash Log',              file: 'panel-crash-log.png'  },
        { id: 'setup',      label: 'Setup & Configuration',  file: 'panel-setup.png'      },
    ],

    docs: {
        'watchdog': `
<p>The <strong>Watchdog Dashboard</strong> shows the current status of the crash recovery system.</p>
<ul>
<li><strong>Watchdog status</strong> — Active (system cron is running and probing the site) or Inactive (not configured or cron not set up).</li>
<li><strong>Last probe</strong> — timestamp of the most recent health check. Should be within the last 2 minutes if active.</li>
<li><strong>Last response code</strong> — the HTTP status code returned by the most recent probe. 200 = healthy; anything else triggers the recovery process.</li>
<li><strong>Recovery count</strong> — number of times the watchdog has automatically recovered the site.</li>
</ul>
<p>The watchdog works by probing the site's frontend URL every minute via a system cron job. If the site returns a non-200 response, it identifies the most recently modified plugin (modified within the last 10 minutes) and deactivates it, then re-probes to confirm recovery.</p>`,

        'crash-log': `
<p>The <strong>Crash Log</strong> records every recovery event with full details for post-incident analysis.</p>
<ul>
<li><strong>Timestamp</strong> — when the crash was detected.</li>
<li><strong>HTTP status</strong> — the error code returned by the site (e.g. 500 Internal Server Error).</li>
<li><strong>Plugin deactivated</strong> — the plugin that was automatically deactivated and deleted. This is determined by finding the plugin whose files were most recently modified before the crash.</li>
<li><strong>Recovery confirmed</strong> — whether the site returned to 200 OK after the plugin was removed.</li>
<li><strong>Response time</strong> — how long the recovery process took from crash detection to confirmed recovery.</li>
</ul>
<p>Review the crash log after any incident to confirm the correct plugin was identified and to take follow-up action (e.g. pinning a specific plugin version or contacting its author).</p>`,

        'setup': `
<p>The watchdog requires a <strong>system cron job</strong> (not WordPress WP-Cron) to run reliably every minute. WP-Cron is triggered by page visits and cannot guarantee minute-level reliability.</p>
<p><strong>Setup steps:</strong></p>
<ol>
<li>Copy the cron command shown in this panel — it will look like:<br><code>* * * * * /usr/bin/php /var/www/html/wp-cron.php</code></li>
<li>Add it to your server's crontab: <code>crontab -e</code></li>
<li>Paste the command and save</li>
<li>Return to this panel and click <strong>Test Connectivity</strong> to confirm the watchdog can probe your site correctly</li>
</ol>
<ul>
<li><strong>Probe URL</strong> — the URL the watchdog probes. Defaults to your site's homepage. Change this if your homepage redirects or requires authentication.</li>
<li><strong>Recovery window</strong> — how recently a plugin must have been modified to be considered the crash culprit (default 10 minutes). Reduce this if you install plugins frequently to avoid false positives.</li>
<li><strong>Notification email</strong> — receive an email alert when a crash is detected and recovered.</li>
</ul>`,
    },
}).catch(err => { console.error('ERROR:', err.message); process.exit(1); });
