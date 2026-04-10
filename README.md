# moodle-local_freshdesk

A Moodle local plugin that adds a floating **Get Help** button to every page, opening a support modal powered by your Freshdesk account. Users can search the Freshdesk knowledge base inline and submit support tickets without leaving Moodle.

## Features

- Floating **Get Help** button on every Moodle page
- In-modal knowledge base search via the Freshdesk API
- Inline article viewer with option to open the full article in Freshdesk
- Pre-filled contact/ticket form (iframe) with user name, email, and current URL
- User role detection (Staff / Student) based on Moodle course capabilities
- Hides automatically for guest/unauthenticated users
- Optional setting to hide the widget from site administrators
- Configurable portal URL, API key, and button colour

## Requirements

- Moodle 4.0 or later
- A Freshdesk account with API access

## Installation

1. Copy the plugin folder into your Moodle installation:
   ```
   /path/to/moodle/local/freshdeskwidget/
   ```

2. Log in as a site administrator and go to:
   **Site Administration → Notifications**
   Moodle will detect the new plugin and run the installer.

3. Go to **Site Administration → Local plugins → Freshdesk Support Widget** to configure the plugin.

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Enable widget | Show or hide the widget site-wide | Enabled |
| Freshdesk portal URL | Your Freshdesk account URL | `https://thefeaturecreep.freshdesk.com` |
| Freshdesk API key | Found in Freshdesk under Profile Settings → Your API Key | *(empty)* |
| Widget button colour | Hex colour for the Get Help button | `#006B6B` |
| Hide for site administrators | Suppress the widget for Moodle admins | Disabled |

## Building the JavaScript

The `amd/build/widget.min.js` file is currently an unminified copy of the source. To generate a proper minified build, run Grunt from your Moodle root:

```bash
cd /path/to/moodle
npm install
grunt amd --root=local/freshdeskwidget
```

## File Structure

```
local/freshdeskwidget/
├── amd/
│   ├── build/
│   │   └── widget.min.js       # Built AMD module (loaded by Moodle)
│   └── src/
│       └── widget.js           # Source AMD module
├── db/
│   ├── install.php             # Sets default config values on install
│   └── upgrade.php             # Upgrade steps for future versions
├── lang/
│   └── en/
│       └── local_freshdeskwidget.php  # English language strings
├── lib.php                     # before_footer hook — injects widget
├── settings.php                # Admin settings page
├── version.php                 # Plugin metadata
└── README.md
```

## License

This plugin is licensed under the [GNU General Public License v3 or later](http://www.gnu.org/copyleft/gpl.html).
