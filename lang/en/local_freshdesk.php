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
$string['api_key_desc']         = 'Your Freshdesk API key (Profile Settings > Your API Key). Used server-side only to search knowledge base articles and submit support tickets. Never sent to the browser.';
$string['enabled']              = 'Enable widget';
$string['enabled_desc']         = 'Show the Freshdesk support widget on all Moodle pages.';
$string['errorsubmitting']      = 'Failed to submit your support ticket. Please check the plugin configuration or try again later.';
$string['event_ticket_submitted'] = 'Freshdesk support ticket submitted';
$string['hide_for_admins']      = 'Hide for site administrators';
$string['hide_for_admins_desc'] = 'Do not show the widget to Moodle site administrators.';
$string['pluginname']           = 'Freshdesk Support Widget';
$string['portal_url']           = 'Freshdesk portal URL';
$string['portal_url_desc']      = 'Your Freshdesk account URL, e.g. https://yourcompany.freshdesk.com';
$string['widget_color']         = 'Widget button colour';
$string['widget_color_desc']    = 'Hex colour for the Get Help button, e.g. #006B6B';

// Privacy metadata strings.
$string['privacy:metadata:freshdesk']            = 'When a user submits a support ticket, personal data is transmitted to the Freshdesk support platform to create and manage the ticket. No data is stored within Moodle.';
$string['privacy:metadata:freshdesk:email']      = 'The user\'s email address, used as the Freshdesk contact identifier.';
$string['privacy:metadata:freshdesk:name']       = 'The user\'s full name, included in the Freshdesk ticket.';
$string['privacy:metadata:freshdesk:username']   = 'The user\'s Moodle username, included in the ticket description for administrator reference.';
$string['privacy:metadata:freshdesk:userid']     = 'The user\'s Moodle numeric ID, included in the ticket description for administrator reference.';
$string['privacy:metadata:freshdesk:profileurl'] = 'A direct URL to the user\'s Moodle profile page, included in the ticket description.';
$string['privacy:metadata:freshdesk:coursename'] = 'The name of the course the user was viewing when the ticket was submitted.';
$string['privacy:metadata:freshdesk:pageurl']    = 'The URL of the Moodle page the user was viewing when the ticket was submitted.';
$string['privacy:metadata:freshdesk:userrole']   = 'The user\'s role label (Staff or Student) in the current course context.';
$string['privacy:metadata:freshdesk:message']    = 'The support message written by the user.';
$string['privacy:metadata:freshdesk:screenshot'] = 'An optional screenshot image attached by the user to illustrate the issue.';
