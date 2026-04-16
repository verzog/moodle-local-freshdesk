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
 * External function to search Freshdesk knowledge base articles.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdesk\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Proxies knowledge base article searches to the Freshdesk REST API, keeping the API key server-side.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class search_articles extends external_api {

    /**
     * Defines the parameters accepted by execute().
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'query' => new external_value(PARAM_TEXT, 'Search term'),
        ]);
    }

    /**
     * Searches Freshdesk knowledge base articles via a server-side HTTP request.
     *
     * The API key never reaches the browser. Returns an empty article list when
     * the plugin is disabled or not yet configured.
     *
     * @param string $query The search term entered by the user.
     * @return array
     */
    public static function execute(string $query): array {
        global $CFG;

        require_once($CFG->libdir . '/filelib.php');

        $params = self::validate_parameters(self::execute_parameters(), ['query' => $query]);

        $config    = get_config('local_freshdesk');
        $apikey    = (string) ($config->api_key ?? '');
        $portalurl = rtrim((string) ($config->portal_url ?? ''), '/');

        if (empty($config->enabled) || $apikey === '' || $portalurl === '') {
            return ['articles' => []];
        }

        $url  = $portalurl . '/api/v2/search/solutions?term=' . urlencode($params['query']);
        $curl = new \curl();
        $curl->setHeader([
            'Authorization: Basic ' . base64_encode($apikey . ':X'),
            'Content-Type: application/json',
        ]);
        $response = $curl->get($url);
        $info     = $curl->get_info();
        $httpcode = (int) ($info['http_code'] ?? 0);

        if ($httpcode !== 200) {
            return ['articles' => []];
        }

        $data    = json_decode($response, true);
        $results = $data['results'] ?? (is_array($data) ? $data : []);

        $articles = [];
        foreach (array_slice($results, 0, 10) as $item) {
            if (!is_array($item) || empty($item['id'])) {
                continue;
            }
            $articles[] = [
                'id'               => (int) $item['id'],
                'title'            => (string) ($item['title'] ?? ''),
                'description_text' => (string) ($item['description_text'] ?? $item['description'] ?? ''),
            ];
        }

        return ['articles' => $articles];
    }

    /**
     * Defines the return value structure.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'articles' => new external_multiple_structure(
                new external_single_structure([
                    'id'               => new external_value(PARAM_INT,  'Article ID'),
                    'title'            => new external_value(PARAM_TEXT, 'Article title'),
                    'description_text' => new external_value(PARAM_TEXT, 'Article plain-text description'),
                ])
            ),
        ]);
    }
}
