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
 * PHPUnit tests for local_freshdesk\external\search_articles and get_article.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdesk\tests\external;

use local_freshdesk\external\search_articles;
use local_freshdesk\external\get_article;

/**
 * Tests for the search_articles and get_article external functions.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_freshdesk\external\search_articles
 * @covers     \local_freshdesk\external\get_article
 */
class search_articles_test extends \advanced_testcase {

    // -------------------------------------------------------------------------
    // search_articles
    // -------------------------------------------------------------------------

    /**
     * Verify search_articles execute_parameters() returns the expected structure.
     */
    public function test_search_articles_parameters_structure(): void {
        $params = search_articles::execute_parameters();
        $this->assertInstanceOf(\core_external\external_function_parameters::class, $params);
        $this->assertArrayHasKey('query', $params->keys);
    }

    /**
     * Verify search_articles execute_returns() wraps an articles array.
     */
    public function test_search_articles_returns_structure(): void {
        $returns = search_articles::execute_returns();
        $this->assertInstanceOf(\core_external\external_single_structure::class, $returns);
        $this->assertArrayHasKey('articles', $returns->keys);
    }

    /**
     * search_articles returns an empty list when the plugin is disabled.
     */
    public function test_search_articles_returns_empty_when_disabled(): void {
        $this->resetAfterTest();
        set_config('enabled',    0,         'local_freshdesk');
        set_config('api_key',    'somekey', 'local_freshdesk');
        set_config('portal_url', 'https://example.freshdesk.com', 'local_freshdesk');
        $this->setAdminUser();

        $result = search_articles::execute('moodle quiz');
        $this->assertIsArray($result['articles']);
        $this->assertEmpty($result['articles']);
    }

    /**
     * search_articles returns an empty list when no API key is set.
     */
    public function test_search_articles_returns_empty_when_no_api_key(): void {
        $this->resetAfterTest();
        set_config('enabled',    1,  'local_freshdesk');
        set_config('api_key',    '', 'local_freshdesk');
        set_config('portal_url', '', 'local_freshdesk');
        $this->setAdminUser();

        $result = search_articles::execute('moodle quiz');
        $this->assertIsArray($result['articles']);
        $this->assertEmpty($result['articles']);
    }

    // -------------------------------------------------------------------------
    // get_article
    // -------------------------------------------------------------------------

    /**
     * Verify get_article execute_parameters() returns the expected structure.
     */
    public function test_get_article_parameters_structure(): void {
        $params = get_article::execute_parameters();
        $this->assertInstanceOf(\core_external\external_function_parameters::class, $params);
        $this->assertArrayHasKey('articleid', $params->keys);
    }

    /**
     * Verify get_article execute_returns() contains title and description keys.
     */
    public function test_get_article_returns_structure(): void {
        $returns = get_article::execute_returns();
        $this->assertInstanceOf(\core_external\external_single_structure::class, $returns);
        $this->assertArrayHasKey('title',       $returns->keys);
        $this->assertArrayHasKey('description', $returns->keys);
    }

    /**
     * get_article throws when the plugin is disabled.
     */
    public function test_get_article_throws_when_disabled(): void {
        $this->resetAfterTest();
        set_config('enabled',    0,             'local_freshdesk');
        set_config('api_key',    'somekey',     'local_freshdesk');
        set_config('portal_url', 'https://example.freshdesk.com', 'local_freshdesk');
        $this->setAdminUser();

        $this->expectException(\moodle_exception::class);
        get_article::execute(12345);
    }

    /**
     * get_article throws when no API key is configured.
     */
    public function test_get_article_throws_when_no_api_key(): void {
        $this->resetAfterTest();
        set_config('enabled',    1,  'local_freshdesk');
        set_config('api_key',    '', 'local_freshdesk');
        set_config('portal_url', '', 'local_freshdesk');
        $this->setAdminUser();

        $this->expectException(\moodle_exception::class);
        get_article::execute(12345);
    }
}
