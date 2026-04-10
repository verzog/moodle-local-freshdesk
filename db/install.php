<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Runs once when the plugin is first installed.
 * Sets sensible defaults in the plugin config table.
 */
function xmldb_local_freshdeskwidget_install() {
    set_config('enabled',        1,                                      'local_freshdeskwidget');
    set_config('portal_url',     'https://thefeaturecreep.freshdesk.com','local_freshdeskwidget');
    set_config('api_key',        '',                                     'local_freshdeskwidget');
    set_config('widget_color',   '#006B6B',                              'local_freshdeskwidget');
    set_config('hide_for_admins',0,                                      'local_freshdeskwidget');

    return true;
}
