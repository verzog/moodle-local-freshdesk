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
 * Admin settings for the Freshdesk support widget plugin.
 *
 * @package    local_freshdeskwidget
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage(
        'local_freshdeskwidget',
        get_string('pluginname', 'local_freshdeskwidget')
    );

    $ADMIN->add('localplugins', $settings);

    $settings->add(new admin_setting_configcheckbox(
        'local_freshdeskwidget/enabled',
        get_string('enabled', 'local_freshdeskwidget'),
        get_string('enabled_desc', 'local_freshdeskwidget'),
        1
    ));

    $settings->add(new admin_setting_configtext(
        'local_freshdeskwidget/portal_url',
        get_string('portal_url', 'local_freshdeskwidget'),
        get_string('portal_url_desc', 'local_freshdeskwidget'),
        'https://thefeaturecreep.freshdesk.com',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_freshdeskwidget/api_key',
        get_string('api_key', 'local_freshdeskwidget'),
        get_string('api_key_desc', 'local_freshdeskwidget'),
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_freshdeskwidget/widget_color',
        get_string('widget_color', 'local_freshdeskwidget'),
        get_string('widget_color_desc', 'local_freshdeskwidget'),
        '#006B6B',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_freshdeskwidget/hide_for_admins',
        get_string('hide_for_admins', 'local_freshdeskwidget'),
        get_string('hide_for_admins_desc', 'local_freshdeskwidget'),
        0
    ));
}
