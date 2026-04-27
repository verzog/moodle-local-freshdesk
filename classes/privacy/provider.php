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
 * Privacy provider for local_freshdesk.
 *
 * This plugin stores no personal data in Moodle's database. When a user
 * submits a support ticket, the following fields are transmitted to the
 * external Freshdesk service: name, email, Moodle username, user ID,
 * profile URL, current course name, page URL, role label, ticket message,
 * and an optional screenshot. Data retention is governed by Freshdesk's
 * own privacy policy.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdesk\privacy;

use core_privacy\local\metadata\collection;

/**
 * Privacy provider declaring data sent to the external Freshdesk service.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements \core_privacy\local\metadata\provider {
    /**
     * Describes the personal data this plugin sends to external systems.
     *
     * No data is stored in Moodle's own database; all personal data is
     * transmitted to the Freshdesk support platform when a ticket is submitted.
     *
     * @param collection $collection Metadata collection to populate.
     * @return collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_external_location_link(
            'freshdesk',
            [
                'email'       => 'privacy:metadata:freshdesk:email',
                'name'        => 'privacy:metadata:freshdesk:name',
                'username'    => 'privacy:metadata:freshdesk:username',
                'userid'      => 'privacy:metadata:freshdesk:userid',
                'profileurl'  => 'privacy:metadata:freshdesk:profileurl',
                'coursename'  => 'privacy:metadata:freshdesk:coursename',
                'pageurl'     => 'privacy:metadata:freshdesk:pageurl',
                'userrole'    => 'privacy:metadata:freshdesk:userrole',
                'message'     => 'privacy:metadata:freshdesk:message',
                'screenshot'  => 'privacy:metadata:freshdesk:screenshot',
            ],
            'privacy:metadata:freshdesk'
        );

        return $collection;
    }
}
