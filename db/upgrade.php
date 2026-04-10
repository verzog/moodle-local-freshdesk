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

    return true;
}
