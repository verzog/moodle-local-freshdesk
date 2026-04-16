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
 * External function to retrieve a single Freshdesk knowledge base article.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdesk\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Proxies single article retrieval to the Freshdesk REST API, keeping the API key server-side.
 *
 * The description field is returned as raw HTML (PARAM_RAW) because Freshdesk article
 * bodies are HTML authored by trusted administrators of the configured Freshdesk instance.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_article extends external_api {

    /**
     * Defines the parameters accepted by execute().
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'articleid' => new external_value(PARAM_INT, 'Freshdesk article ID'),
        ]);
    }

    /**
     * Retrieves a single Freshdesk knowledge base article via a server-side HTTP request.
     *
     * The API key never reaches the browser.
     *
     * @param int $articleid The Freshdesk article ID.
     * @return array
     */
    public static function execute(int $articleid): array {
        global $CFG;

        require_once($CFG->libdir . '/filelib.php');

        $params = self::validate_parameters(self::execute_parameters(), ['articleid' => $articleid]);

        $config    = get_config('local_freshdesk');
        $apikey    = (string) ($config->api_key ?? '');
        $portalurl = rtrim((string) ($config->portal_url ?? ''), '/');

        if (empty($config->enabled) || $apikey === '' || $portalurl === '') {
            throw new \moodle_exception('errorsubmitting', 'local_freshdesk');
        }

        $url  = $portalurl . '/api/v2/solutions/articles/' . (int) $params['articleid'];
        $curl = new \curl();
        $curl->setHeader([
            'Authorization: Basic ' . base64_encode($apikey . ':X'),
            'Content-Type: application/json',
        ]);
        $response = $curl->get($url);
        $info     = $curl->get_info();
        $httpcode = (int) ($info['http_code'] ?? 0);

        if ($httpcode !== 200) {
            throw new \moodle_exception('errorsubmitting', 'local_freshdesk');
        }

        $data = json_decode($response, true);
        if (!is_array($data)) {
            throw new \moodle_exception('errorsubmitting', 'local_freshdesk');
        }

        return [
            'title'       => (string) ($data['title'] ?? ''),
            'description' => (string) ($data['description'] ?? ''),
        ];
    }

    /**
     * Defines the return value structure.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'title'       => new external_value(PARAM_TEXT, 'Article title'),
            'description' => new external_value(PARAM_RAW,  'Article HTML body (trusted Freshdesk content)'),
        ]);
    }
}
