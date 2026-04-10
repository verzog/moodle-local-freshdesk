<?php
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
