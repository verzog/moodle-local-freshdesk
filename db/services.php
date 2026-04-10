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
 * External functions registered for local_freshdeskwidget.
 *
 * @package    local_freshdeskwidget
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_freshdeskwidget_submit_ticket' => [
        'classname'     => \local_freshdeskwidget\external\submit_ticket::class,
        'description'   => 'Submit a Freshdesk support ticket on behalf of the current user.',
        'type'          => 'write',
        'ajax'          => true,
        'loginrequired' => true,
    ],
];
