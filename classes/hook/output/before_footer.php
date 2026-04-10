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

namespace local_freshdeskwidget\hook\output;

/**
 * Injects Freshdesk widget configuration and AMD module into every Moodle page.
 */
class before_footer {

    /**
     * Callback for core\hook\output\before_footer_html_generation.
     *
     * @param \core\hook\output\before_footer_html_generation $hook The hook instance.
     */
    public static function callback(\core\hook\output\before_footer_html_generation $hook): void {
        global $USER, $PAGE, $COURSE;

        $isloggedin = isloggedin() && !isguestuser();
        $isadmin    = is_siteadmin();

        // Get plugin config.
        $config = get_config('local_freshdeskwidget');

        if (empty($config->enabled)) {
            return;
        }

        // Suppress for admins if configured.
        if ($isadmin && !empty($config->hide_for_admins)) {
            return;
        }

        // Determine user role label.
        $context   = \context_course::instance($COURSE->id);
        $isstaff   = has_capability('moodle/course:manageactivities', $context);
        $rolelabel = $isstaff ? 'Staff' : 'Student';

        // User details — empty strings if not logged in.
        $useremail  = $isloggedin ? $USER->email : '';
        $username   = $isloggedin ? fullname($USER) : '';
        $currenturl = $PAGE->url->out(false);
        $coursename = ($COURSE->id > 1) ? format_string($COURSE->fullname) : '';

        // Freshdesk settings.
        $portalurl   = rtrim($config->portal_url ?? 'https://thefeaturecreep.freshdesk.com', '/');
        $apikey      = $config->api_key ?? '';
        $widgetcolor = $config->widget_color ?? '#006B6B';

        // Build ticket form URL with context params.
        $ticketurl    = $portalurl . '/support/tickets/new';
        $ticketparams = http_build_query([
            'url'   => $currenturl,
            'name'  => $username,
            'email' => $useremail,
        ]);
        $ticketformurl = $ticketurl . '?' . $ticketparams;

        // Pass data to JavaScript and initialise the AMD module.
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
