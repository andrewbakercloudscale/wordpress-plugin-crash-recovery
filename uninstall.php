<?php
/**
 * Uninstall CloudScale Crash Recovery.
 *
 * Removes all options and scheduled cron events created by the plugin.
 * Does not remove server-side artefacts (watchdog script, cron entry, log file)
 * because those are installed by the server administrator and are outside
 * WordPress control.
 *
 * @package CloudScale_Crash_Recovery
 * @since   1.5.0
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) { exit; }

// Remove all plugin options.
delete_option( 'cs_pcr_debug_revert_at' );
delete_option( 'cs_pcr_custom_404' );

// Clear the WP-Cron safety-net event for debug revert.
wp_clear_scheduled_hook( 'cs_pcr_revert_debug_hook' );
