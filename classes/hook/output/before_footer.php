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
 * Hook callback to inject the Freshdesk widget before the page footer.
 *
 * @package    local_freshdeskwidget
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdeskwidget\hook\output;

use core\context\course as course_context;
use core\hook\output\before_footer_html_generation;

/**
 * Injects Freshdesk widget configuration and AMD module into every Moodle page.
 */
class before_footer {

    /**
     * Callback for before_footer_html_generation hook.
     *
     * Passes Freshdesk configuration to JavaScript and initialises the AMD
     * widget module. Skipped when the plugin is disabled or the current user
     * is an admin with the hide-for-admins setting enabled.
     *
     * @param before_footer_html_generation $hook The hook instance.
     */
    public static function callback(before_footer_html_generation $hook): void {
        global $USER, $PAGE, $COURSE;

        $isloggedin = isloggedin() && !isguestuser();
        $isadmin    = is_siteadmin();

        $config = get_config('local_freshdeskwidget');

        if (empty($config->enabled)) {
            return;
        }

        if ($isadmin && !empty($config->hide_for_admins)) {
            return;
        }

        // Determine user role label based on course capability.
        $context   = course_context::instance((int) $COURSE->id);
        $isstaff   = has_capability('moodle/course:manageactivities', $context);
        $rolelabel = $isstaff ? 'Staff' : 'Student';

        // User details are empty strings for guests.
        $useremail  = $isloggedin ? $USER->email : '';
        $username   = $isloggedin ? fullname($USER) : '';
        $currenturl = $PAGE->url->out(false);
        $coursename = ($COURSE->id > 1) ? format_string($COURSE->fullname) : '';

        // Load Freshdesk settings from plugin config.
        $portalurl   = rtrim((string) ($config->portal_url ?? 'https://thefeaturecreep.freshdesk.com'), '/');
        $apikey      = (string) ($config->api_key ?? '');
        $widgetcolor = (string) ($config->widget_color ?? '#006B6B');

        // Build a pre-filled ticket form URL with user context.
        $ticketformurl = $portalurl . '/support/tickets/new?' . http_build_query([
            'url'   => $currenturl,
            'name'  => $username,
            'email' => $useremail,
        ]);

        $PAGE->requires->data_for_js('local_freshdeskwidget_config', [
            'portalUrl'     => $portalurl,
            'apiKey'        => $apikey,
            'ticketFormUrl' => $ticketformurl,
            'userEmail'     => $useremail,
            'userName'      => $username,
            'currentUrl'    => $currenturl,
            'courseName'    => $coursename,
            'userRole'      => $rolelabel,
            'isLoggedIn'    => $isloggedin,
            'widgetColor'   => $widgetcolor,
        ]);

        $PAGE->requires->js_call_amd('local_freshdeskwidget/widget', 'init');
    }
}
