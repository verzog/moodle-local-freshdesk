<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Inject the Freshdesk modal into every Moodle page footer.
 * Hooked via local_freshdeskwidget_before_footer().
 */
function local_freshdeskwidget_before_footer() {
    global $USER, $PAGE, $COURSE, $CFG;

    // Don't show on login page or to non-logged-in users
    // (anonymous users get a version without pre-filled details)
    $isloggedin  = isloggedin() && !isguestuser();
    $isadmin     = is_siteadmin();

    // Get plugin config
    $config = get_config('local_freshdeskwidget');

    if (empty($config->enabled)) {
        return;
    }

    // Suppress for admins if configured
    if ($isadmin && !empty($config->hide_for_admins)) {
        return;
    }

    // Determine user role label
    $context  = context_course::instance($COURSE->id);
    $isstaff  = has_capability('moodle/course:manageactivities', $context);
    $rolelabel = $isstaff ? 'Staff' : 'Student';

    // User details (empty strings if not logged in)
    $useremail   = $isloggedin ? $USER->email : '';
    $username    = $isloggedin ? fullname($USER) : '';
    $currenturl  = $PAGE->url->out(false);
    $coursename  = ($COURSE->id > 1) ? format_string($COURSE->fullname) : '';

    // Freshdesk settings
    $portalurl  = rtrim($config->portal_url ?? 'https://thefeaturecreep.freshdesk.com', '/');
    $apikey     = $config->api_key ?? '';
    $widgetcolor = $config->widget_color ?? '#006B6B';

    // Ticket form URL with context params
    $ticketurl = $portalurl . '/support/tickets/new';
    $ticketparams = http_build_query([
        'url'  => $currenturl,
        'name' => $username,
        'email'=> $useremail,
    ]);
    $ticketformurl = $ticketurl . '?' . $ticketparams;

    // Pass data to JavaScript
    $PAGE->requires->data_for_js('local_freshdeskwidget_config', [
        'portalUrl'     => $portalurl,
        'apiKey'        => $apikey,
        'ticketFormUrl' => $ticketformurl,
        'userEmail'     => $useremail,
        'userName'      => $username,
        'currentUrl'    => $currenturl,
        'courseName'    => $coursename,
        'userRole'      => $rolelabel,
        'isLoggedIn'    => $isloggedin,
        'widgetColor'   => $widgetcolor,
    ]);

    $PAGE->requires->js_call_amd('local_freshdeskwidget/widget', 'init');
}
