<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Runs upgrade steps between plugin versions.
 *
 * @param int $oldversion The version we are upgrading from.
 * @return bool
 */
function xmldb_local_freshdeskwidget_upgrade($oldversion) {

    // Future upgrade steps go here, e.g.:
    // if ($oldversion < 2026050100) {
    //     // do something
    //     upgrade_plugin_savepoint(true, 2026050100, 'local', 'freshdeskwidget');
    // }

    return true;
}
