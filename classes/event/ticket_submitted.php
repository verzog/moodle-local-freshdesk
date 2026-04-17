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
 * Event fired when a Freshdesk support ticket is successfully submitted.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdesk\event;

/**
 * Triggered after a user successfully submits a Freshdesk support ticket.
 *
 * Appears in the Moodle site log, giving administrators an audit trail of
 * all ticket submissions and the data sent to the external service.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class ticket_submitted extends \core\event\base {
    /**
     * Initialises the event metadata.
     *
     * @return void
     */
    protected function init(): void {
        $this->data['crud']     = 'c';
        $this->data['edulevel'] = self::LEVEL_OTHER;
    }

    /**
     * Returns the human-readable event name.
     *
     * @return string
     */
    public static function get_name(): string {
        return get_string('event_ticket_submitted', 'local_freshdesk');
    }

    /**
     * Returns a description for the log entry.
     *
     * @return string
     */
    public function get_description(): string {
        $subject = isset($this->other['subject']) ? s($this->other['subject']) : '';
        return "The user with id '{$this->userid}' submitted a Freshdesk support ticket" .
            ($subject !== '' ? " with subject: {$subject}" : '') . '.';
    }

    /**
     * Returns a URL associated with the event (falls back to site root).
     *
     * @return \moodle_url
     */
    public function get_url(): \moodle_url {
        return new \moodle_url('/');
    }
}
