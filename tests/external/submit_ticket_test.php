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
 * PHPUnit tests for local_freshdesk\external\submit_ticket.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

namespace local_freshdesk\tests\external;

use local_freshdesk\external\submit_ticket;

/**
 * Tests for the submit_ticket external function.
 *
 * @package    local_freshdesk
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \local_freshdesk\external\submit_ticket
 */
class submit_ticket_test extends \advanced_testcase {

    /**
     * Verify execute_parameters() returns the expected structure.
     */
    public function test_execute_parameters_structure(): void {
        $params = submit_ticket::execute_parameters();
        $this->assertInstanceOf(\core_external\external_function_parameters::class, $params);
        $keys = array_keys($params->keys);
        $this->assertContains('subject',    $keys);
        $this->assertContains('message',    $keys);
        $this->assertContains('currenturl', $keys);
        $this->assertContains('coursename', $keys);
        $this->assertContains('userrole',   $keys);
        $this->assertContains('screenshot', $keys);
    }

    /**
     * Verify execute_returns() returns the expected structure.
     */
    public function test_execute_returns_structure(): void {
        $returns = submit_ticket::execute_returns();
        $this->assertInstanceOf(\core_external\external_single_structure::class, $returns);
        $this->assertArrayHasKey('success', $returns->keys);
    }

    /**
     * execute() must throw when the plugin is disabled.
     */
    public function test_execute_throws_when_plugin_disabled(): void {
        $this->resetAfterTest();
        set_config('enabled',    0,             'local_freshdesk');
        set_config('api_key',    'somekey',     'local_freshdesk');
        set_config('portal_url', 'https://example.freshdesk.com', 'local_freshdesk');
        $this->setAdminUser();

        $this->expectException(\moodle_exception::class);
        submit_ticket::execute('Subject', 'Message', 'https://moodle.example.com', '', '', '');
    }

    /**
     * execute() must throw when no API key is configured.
     */
    public function test_execute_throws_when_no_api_key(): void {
        $this->resetAfterTest();
        set_config('enabled',    1,  'local_freshdesk');
        set_config('api_key',    '', 'local_freshdesk');
        set_config('portal_url', '', 'local_freshdesk');
        $this->setAdminUser();

        $this->expectException(\moodle_exception::class);
        submit_ticket::execute('Subject', 'Message', 'https://moodle.example.com', '', '', '');
    }

    /**
     * execute() must throw when portal URL is missing even if API key is set.
     */
    public function test_execute_throws_when_no_portal_url(): void {
        $this->resetAfterTest();
        set_config('enabled',    1,         'local_freshdesk');
        set_config('api_key',    'somekey', 'local_freshdesk');
        set_config('portal_url', '',        'local_freshdesk');
        $this->setAdminUser();

        $this->expectException(\moodle_exception::class);
        submit_ticket::execute('Subject', 'Message', 'https://moodle.example.com', '', '', '');
    }

    /**
     * An invalid (non-JPEG) base64 screenshot must be silently skipped, not cause
     * a distinct exception. The function should still throw errorsubmitting because
     * the test Freshdesk URL is unreachable — NOT because of screenshot validation.
     *
     * @dataProvider invalid_screenshot_provider
     */
    public function test_invalid_screenshot_silently_skipped(string $screenshot): void {
        $this->resetAfterTest();
        set_config('enabled',    1,                              'local_freshdesk');
        set_config('api_key',    'testkey',                      'local_freshdesk');
        set_config('portal_url', 'https://invalid.freshdesk.com', 'local_freshdesk');
        $this->setAdminUser();

        // Must throw moodle_exception (HTTP failure) not any other exception type.
        $this->expectException(\moodle_exception::class);
        submit_ticket::execute('Subject', 'Message', 'https://moodle.example.com', '', '', $screenshot);
    }

    /**
     * Data provider for invalid screenshots.
     *
     * @return array
     */
    public static function invalid_screenshot_provider(): array {
        return [
            'plain text encoded as base64' => [base64_encode('not-an-image')],
            'valid base64 but not JPEG'    => [base64_encode('PNG_HEADER_FAKE')],
        ];
    }
}
