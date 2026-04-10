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
 * External function to submit a Freshdesk support ticket.
 *
 * @package    local_freshdeskwidget
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdeskwidget\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Proxies ticket creation to the Freshdesk REST API, keeping the API key server-side.
 *
 * @package    local_freshdeskwidget
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class submit_ticket extends external_api {

    /**
     * Defines the parameters accepted by execute().
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'subject'    => new external_value(PARAM_TEXT, 'Ticket subject'),
            'message'    => new external_value(PARAM_TEXT, 'Ticket message body'),
            'currenturl' => new external_value(PARAM_TEXT, 'Current page URL'),
            'coursename' => new external_value(PARAM_TEXT, 'Current course name', VALUE_DEFAULT, ''),
            'userrole'   => new external_value(PARAM_TEXT, 'User role label', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Submits a ticket to Freshdesk via server-side HTTP request.
     *
     * User identity (name and email) is sourced from the Moodle session, not
     * from client-supplied values, to prevent spoofing. The API key never
     * leaves the server.
     *
     * @param string $subject    Ticket subject line.
     * @param string $message    Message body written by the user.
     * @param string $currenturl URL of the page the user was on.
     * @param string $coursename Name of the current course, or empty string.
     * @param string $userrole   Role label (Staff or Student), or empty string.
     * @return array
     */
    public static function execute(
        string $subject,
        string $message,
        string $currenturl,
        string $coursename,
        string $userrole
    ): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'subject'    => $subject,
            'message'    => $message,
            'currenturl' => $currenturl,
            'coursename' => $coursename,
            'userrole'   => $userrole,
        ]);

        $config    = get_config('local_freshdeskwidget');
        $apikey    = (string) ($config->api_key ?? '');
        $portalurl = rtrim((string) ($config->portal_url ?? ''), '/');

        if (empty($config->enabled) || $apikey === '' || $portalurl === '') {
            throw new \moodle_exception('errorsubmitting', 'local_freshdeskwidget');
        }

        // Build HTML ticket description with page context.
        $descparts   = [];
        $descparts[] = '<p>' . nl2br(htmlspecialchars($params['message'], ENT_QUOTES)) . '</p>';
        $descparts[] = '<hr>';
        $descparts[] = '<p><strong>Page URL:</strong> ' .
            htmlspecialchars($params['currenturl'], ENT_QUOTES) . '</p>';

        if ($params['coursename'] !== '') {
            $descparts[] = '<p><strong>Course:</strong> ' .
                htmlspecialchars($params['coursename'], ENT_QUOTES) . '</p>';
        }

        if ($params['userrole'] !== '') {
            $descparts[] = '<p><strong>Role:</strong> ' .
                htmlspecialchars($params['userrole'], ENT_QUOTES) . '</p>';
        }

        $descparts[] = '<p><strong>Moodle user ID:</strong> ' . (int) $USER->id . '</p>';

        $payload = json_encode([
            'email'       => $USER->email,
            'name'        => fullname($USER),
            'subject'     => $params['subject'],
            'description' => implode("\n", $descparts),
            'source'      => 2,
        ]);

        $curl = new \curl();
        $curl->setHeader([
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode($apikey . ':X'),
        ]);
        $curl->post($portalurl . '/api/v2/tickets', $payload);

        $info     = $curl->get_info();
        $httpcode = (int) ($info['http_code'] ?? 0);

        if ($httpcode !== 201) {
            debugging(
                'local_freshdeskwidget: Freshdesk API returned HTTP ' . $httpcode .
                ' for ' . $portalurl . '/api/v2/tickets',
                DEBUG_DEVELOPER
            );
            throw new \moodle_exception('errorsubmitting', 'local_freshdeskwidget');
        }

        return ['success' => true];
    }

    /**
     * Defines the return value structure.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Whether the ticket was created successfully'),
        ]);
    }
}
