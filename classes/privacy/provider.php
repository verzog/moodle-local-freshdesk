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
 * Privacy API provider for local_freshdesk.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdesk\privacy;

use core_privacy\local\metadata\collection;

/**
 * Privacy provider for local_freshdesk.
 *
 * This plugin transmits personal data to the configured Freshdesk instance
 * when a user submits a support ticket. No personal data is stored locally.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\null_provider {

    /**
     * Returns metadata describing personal data transmitted to Freshdesk.
     *
     * @param collection $collection The metadata collection to populate.
     * @return collection The enriched metadata collection.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_external_location_link(
            'freshdesk',
            [
                'email'      => 'privacy:metadata:freshdesk:email',
                'name'       => 'privacy:metadata:freshdesk:name',
                'username'   => 'privacy:metadata:freshdesk:username',
                'userid'     => 'privacy:metadata:freshdesk:userid',
                'profileurl' => 'privacy:metadata:freshdesk:profileurl',
                'pageurl'    => 'privacy:metadata:freshdesk:pageurl',
                'coursename' => 'privacy:metadata:freshdesk:coursename',
                'userrole'   => 'privacy:metadata:freshdesk:userrole',
            ],
            'privacy:metadata:freshdesk'
        );
        return $collection;
    }

    /**
     * Returns a lang string key explaining why no local user data can be exported or deleted.
     *
     * @return string Language string key.
     */
    public static function get_reason(): string {
        return 'privacy:reason';
    }
}
