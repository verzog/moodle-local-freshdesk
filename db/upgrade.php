<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Upgrade steps between plugin versions.
 *
 * @package    local_freshdeskwidget
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Runs upgrade steps between plugin versions.
 *
 * @param int $oldversion The version we are upgrading from.
 * @return bool
 */
function xmldb_local_freshdeskwidget_upgrade($oldversion): bool {

    if ($oldversion < 2026041002) {
        // Ticket form URL now pre-fills subject and description with course/role context.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041002, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041003) {
        // Contact form replaced with native Moodle form submitting via PHP proxy to Freshdesk API.
        // API key is now kept server-side. New external function: local_freshdeskwidget_submit_ticket.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041003, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041004) {
        // Fix: removed declare(strict_types=1) from db/upgrade.php and db/install.php.
        // Moodle passes oldversion as a string; strict types caused a silent TypeError.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041004, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041005) {
        // Coding standards pass: added MOODLE_INTERNAL guard to lib.php, install.php,
        // and upgrade.php; added @package/@copyright/@license to class docblocks;
        // fixed @return type shape in external function; cleaned inline comment style.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041005, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041006) {
        // Add debugging output and console logging to help diagnose ticket submission errors.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041006, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041007) {
        // Fix: require_once filelib.php before using \curl in external function.
        // The AJAX service context does not auto-load lib/filelib.php.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041007, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041008) {
        // Improve console error logging to print full JSON string for easier diagnosis.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041008, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041009) {
        // Include Freshdesk HTTP code and response body in exception debuginfo so it
        // appears in the browser console without needing developer debug mode.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041009, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041010) {
        // Fix: add required status (2=Open) and priority (1=Low) fields to Freshdesk
        // ticket payload. Without these the API returns HTTP 400 validation failed.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041010, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041011) {
        // Enhancement: contact form now shows submitting user name and auto-suggests
        // related knowledge base articles based on current course or page URL.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041011, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041012) {
        // Enhancement: auto-suggested articles now also appear on the modal home screen
        // when the widget is opened, using the course name or page URL as the search term.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041012, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041013) {
        // Enhancement: Freshdesk ticket description now includes the submitting user's
        // Moodle username and a direct profile URL, resolved server-side.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041013, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041014) {
        // Enhancement: article suggestions now search both the course name and the
        // current activity type (e.g. quiz, assign) in parallel and merge results,
        // increasing the likelihood of relevant articles appearing.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041014, 'local', 'freshdeskwidget');
    }

    if ($oldversion < 2026041015) {
        // Feature: screenshot attachment in the contact form (file upload or clipboard
        // paste). Screenshots are compressed to JPEG client-side and sent as a
        // multipart attachment via the server-side Freshdesk API proxy.
        // Coding standards: added declare(strict_types=1) to db/install.php;
        // added JSDoc module block and init docblock to amd/src/widget.js.
        // No database changes required.
        upgrade_plugin_savepoint(true, 2026041015, 'local', 'freshdeskwidget');
    }

    return true;
}
