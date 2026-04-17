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
 * External function to search Freshdesk knowledge base articles server-side.
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
 * Proxies Freshdesk knowledge base search to keep the API key server-side.
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
            'term' => new external_value(PARAM_TEXT, 'Search term'),
        ]);
    }

    /**
     * Searches the Freshdesk knowledge base server-side and returns matching articles.
     *
     * The API key is read from plugin config and never exposed to the browser.
     *
     * @param string $term Search term.
     * @return array List of matching articles (id, title, description_text).
     */
    public static function execute(string $term): array {
        global $CFG;

        require_once($CFG->libdir . '/filelib.php');

        $params = self::validate_parameters(self::execute_parameters(), ['term' => $term]);

        $config    = get_config('local_freshdesk');
        $apikey    = (string) ($config->api_key ?? '');
        $portalurl = rtrim((string) ($config->portal_url ?? ''), '/');

        if (empty($config->enabled) || $apikey === '' || $portalurl === '') {
            return [];
        }

        $curl = new \curl();
        $curl->setHeader([
            'Authorization: Basic ' . base64_encode($apikey . ':X'),
            'Content-Type: application/json',
        ]);

        $url          = $portalurl . '/api/v2/search/solutions?term=' . urlencode($params['term']);
        $responsebody = $curl->get($url);
        $info         = $curl->get_info();
        $httpcode     = (int) ($info['http_code'] ?? 0);

        if ($httpcode !== 200) {
            return [];
        }

        $data    = json_decode($responsebody, true);
        $results = $data['results'] ?? $data ?? [];

        if (!is_array($results)) {
            return [];
        }

        $articles = [];
        foreach (array_slice($results, 0, 8) as $article) {
            if (empty($article['id']) || empty($article['title'])) {
                continue;
            }
            $articles[] = [
                'id'               => (int) $article['id'],
                'title'            => (string) ($article['title']),
                'description_text' => (string) ($article['description_text'] ?? $article['description'] ?? ''),
            ];
        }

        return $articles;
    }

    /**
     * Defines the return value structure.
     *
     * @return external_multiple_structure
     */
    public static function execute_returns(): external_multiple_structure {
        return new external_multiple_structure(
            new external_single_structure([
                'id'               => new external_value(PARAM_INT, 'Article ID'),
                'title'            => new external_value(PARAM_TEXT, 'Article title'),
                'description_text' => new external_value(PARAM_RAW, 'Article plain-text description'),
            ])
        );
    }
}
