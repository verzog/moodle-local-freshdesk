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
 * English language strings for local_freshdesk.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['api_key']              = 'Freshdesk API key';
$string['api_key_desc']         = 'Your Freshdesk API key (Profile Settings > Your API Key). Used server-side to search knowledge base articles and submit support tickets.';
$string['enabled']              = 'Enable widget';
$string['enabled_desc']         = 'Show the Freshdesk support widget on all Moodle pages.';
$string['errorsubmitting']      = 'Failed to submit your support ticket. Please check the plugin configuration or try again later.';
$string['hide_for_admins']      = 'Hide for site administrators';
$string['hide_for_admins_desc'] = 'Do not show the widget to Moodle site administrators.';
$string['pluginname']           = 'Freshdesk Support Widget';
$string['portal_url']           = 'Freshdesk portal URL';
$string['portal_url_desc']      = 'Your Freshdesk account URL, e.g. https://yourcompany.freshdesk.com';
$string['role_staff']           = 'Staff';
$string['role_student']         = 'Student';
$string['widget_color']         = 'Widget button colour';
$string['widget_color_desc']    = 'Colour for the Get Help button.';

// Privacy API.
$string['privacy:metadata:freshdesk']             = 'Freshdesk support platform';
$string['privacy:metadata:freshdesk:email']       = 'Your email address, used as the ticket requester in Freshdesk.';
$string['privacy:metadata:freshdesk:name']        = 'Your full name, included in the support ticket.';
$string['privacy:metadata:freshdesk:username']    = 'Your Moodle username, included in the ticket description for context.';
$string['privacy:metadata:freshdesk:userid']      = 'Your Moodle user ID, included in the ticket description for context.';
$string['privacy:metadata:freshdesk:profileurl']  = 'A link to your Moodle profile, included in the ticket description.';
$string['privacy:metadata:freshdesk:pageurl']     = 'The URL of the Moodle page you were on when you submitted the ticket.';
$string['privacy:metadata:freshdesk:coursename']  = 'The name of the Moodle course you were in when you submitted the ticket, if applicable.';
$string['privacy:metadata:freshdesk:userrole']    = 'Your role in the course (Staff or Student) at the time of ticket submission.';
$string['privacy:reason']                         = 'No personal data is stored locally by this plugin. When you submit a support ticket, your name, email address, Moodle username, user ID, and profile URL are transmitted to the configured Freshdesk instance to create the ticket.';
