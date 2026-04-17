/**
 * Freshdesk Support Widget for Moodle.
 *
 * Renders a floating Help button that opens a modal containing:
 *  - Auto-suggested knowledge base articles on open (course name + activity type)
 *  - A search box that queries the Freshdesk knowledge base via REST API
 *  - Inline article viewer with option to open the full article in Freshdesk
 *  - A native contact form that submits tickets via Moodle AJAX (server-side proxy)
 *  - Optional screenshot attachment via file upload or clipboard paste
 *
 * @module     local_freshdesk/widget
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['core/config', 'core/ajax'], function(mdlConfig, Ajax) {

    /** @type {Object} Plugin configuration passed from PHP via data_for_js. */
    var cfg = {};

    /** @type {string|null} Base64-encoded JPEG screenshot, or null when not set. */
    var screenshotData = null;

    // -------------------------------------------------------------------------
    // CSS injected into the page
    // -------------------------------------------------------------------------
    function injectStyles() {
        var css = [
            /* Help button */
            '#fd-help-btn {',
            '  position: fixed; bottom: 24px; right: 24px; z-index: 9998;',
            '  background: ' + cfg.widgetColor + '; color: #fff;',
            '  border: none; border-radius: 24px;',
            '  padding: 12px 20px; font-size: 15px; font-weight: 600;',
            '  cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.25);',
            '  transition: background 0.2s;',
            '}',
            '#fd-help-btn:hover { filter: brightness(1.1); }',

            /* Overlay */
            '#fd-modal-overlay {',
            '  display: none; position: fixed; top: 0; left: 0;',
            '  width: 100%; height: 100%;',
            '  background: rgba(0,0,0,0.5); z-index: 9999;',
            '}',

            /* Modal box */
            '#fd-modal {',
            '  position: absolute; top: 50%; left: 50%;',
            '  transform: translate(-50%, -50%);',
            '  width: 580px; max-width: 95vw;',
            '  height: 700px; max-height: 90vh;',
            '  background: #fff; border-radius: 10px;',
            '  overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);',
            '  display: flex; flex-direction: column;',
            '}',

            /* Modal header */
            '#fd-modal-header {',
            '  background: ' + cfg.widgetColor + '; color: #fff;',
            '  padding: 14px 16px; display: flex;',
            '  align-items: center; justify-content: space-between;',
            '  flex-shrink: 0;',
            '}',
            '#fd-modal-header h2 {',
            '  margin: 0; font-size: 17px; font-weight: 600; color: #fff;',
            '}',
            '#fd-modal-close {',
            '  background: none; border: none; color: #fff;',
            '  font-size: 22px; cursor: pointer; line-height: 1; padding: 0 4px;',
            '}',

            /* Search panel */
            '#fd-search-panel {',
            '  padding: 14px 16px; border-bottom: 1px solid #e5e5e5;',
            '  flex-shrink: 0;',
            '}',
            '#fd-search-row {',
            '  display: flex; gap: 8px;',
            '}',
            '#fd-search-input {',
            '  flex: 1; padding: 8px 12px; border: 1px solid #ccc;',
            '  border-radius: 6px; font-size: 14px;',
            '}',
            '#fd-search-btn {',
            '  padding: 8px 14px; background: ' + cfg.widgetColor + ';',
            '  color: #fff; border: none; border-radius: 6px;',
            '  font-size: 14px; cursor: pointer;',
            '}',

            /* Results panel */
            '#fd-results {',
            '  flex: 1; overflow-y: auto; padding: 0;',
            '  display: flex; flex-direction: column;',
            '}',

            /* Article list */
            '#fd-articles { padding: 8px 16px; }',
            '.fd-article-item {',
            '  padding: 10px 0; border-bottom: 1px solid #f0f0f0;',
            '}',
            '.fd-article-item:last-child { border-bottom: none; }',
            '.fd-article-title {',
            '  font-size: 14px; font-weight: 600;',
            '  color: ' + cfg.widgetColor + '; cursor: pointer;',
            '  text-decoration: none; display: block; margin-bottom: 4px;',
            '}',
            '.fd-article-title:hover { text-decoration: underline; }',
            '.fd-article-desc {',
            '  font-size: 13px; color: #555; margin: 0;',
            '}',

            /* Article full view */
            '#fd-article-view {',
            '  display: none; flex-direction: column; height: 100%;',
            '}',
            '#fd-article-back {',
            '  padding: 10px 16px; background: #f5f5f5;',
            '  border-bottom: 1px solid #e5e5e5; flex-shrink: 0;',
            '  display: flex; gap: 10px; align-items: center;',
            '}',
            '#fd-article-back button {',
            '  background: none; border: none; color: ' + cfg.widgetColor + ';',
            '  font-size: 13px; cursor: pointer; padding: 0;',
            '}',
            '#fd-article-open-btn {',
            '  margin-left: auto; padding: 6px 12px;',
            '  background: ' + cfg.widgetColor + '; color: #fff;',
            '  border: none; border-radius: 6px; font-size: 13px; cursor: pointer;',
            '}',
            '#fd-article-content {',
            '  flex: 1; overflow-y: auto; padding: 16px;',
            '  font-size: 14px; line-height: 1.6; color: #333;',
            '}',
            '#fd-article-content h1, #fd-article-content h2, #fd-article-content h3 {',
            '  color: ' + cfg.widgetColor + ';',
            '}',

            /* Status messages */
            '#fd-status {',
            '  padding: 16px; text-align: center;',
            '  color: #666; font-size: 14px;',
            '}',

            /* Contact form panel */
            '#fd-contact-form { display: none; flex-direction: column; }',
            '#fd-contact-form-back {',
            '  padding: 10px 16px; background: #f5f5f5;',
            '  border-bottom: 1px solid #e5e5e5; flex-shrink: 0;',
            '}',
            '#fd-contact-form-back button {',
            '  background: none; border: none; color: ' + cfg.widgetColor + ';',
            '  font-size: 13px; cursor: pointer; padding: 0;',
            '}',
            '#fd-contact-fields {',
            '  padding: 16px; display: flex; flex-direction: column; gap: 12px;',
            '  overflow-y: auto;',
            '}',
            '#fd-contact-userinfo {',
            '  font-size: 13px; color: #555; padding-bottom: 10px;',
            '  border-bottom: 1px solid #eee;',
            '}',
            '#fd-contact-userinfo strong { color: #333; }',
            '#fd-suggest-section {',
            '  background: #f5f8ff; border: 1px solid #dde8ff;',
            '  border-radius: 6px; padding: 10px 12px;',
            '}',
            '#fd-suggest-heading {',
            '  font-size: 11px; font-weight: 700; color: #666;',
            '  text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;',
            '}',
            '.fd-suggest-item { padding: 5px 0; border-bottom: 1px solid #e0e8ff; }',
            '.fd-suggest-item:last-child { border-bottom: none; }',
            '.fd-suggest-link {',
            '  font-size: 13px; color: ' + cfg.widgetColor + ';',
            '  cursor: pointer; text-decoration: none; display: block;',
            '}',
            '.fd-suggest-link:hover { text-decoration: underline; }',
            '#fd-contact-fields label {',
            '  font-size: 13px; color: #333; font-weight: 600;',
            '  display: block; margin-bottom: 4px;',
            '}',
            '#fd-ticket-subject, #fd-ticket-message {',
            '  width: 100%; box-sizing: border-box; padding: 8px 12px;',
            '  border: 1px solid #ccc; border-radius: 6px;',
            '  font-size: 14px; font-family: inherit;',
            '}',
            '#fd-ticket-message { height: 110px; resize: vertical; }',
            '#fd-contact-submit {',
            '  padding: 9px 20px; background: ' + cfg.widgetColor + '; color: #fff;',
            '  border: none; border-radius: 6px; font-size: 14px;',
            '  cursor: pointer; width: 100%;',
            '}',
            '#fd-contact-submit:disabled { opacity: 0.6; cursor: not-allowed; }',
            '#fd-contact-error { color: #c00; font-size: 13px; display: none; }',
            '#fd-privacy-notice {',
            '  font-size: 11px; color: #888; margin: 4px 0 2px; line-height: 1.4;',
            '}',
            '#fd-contact-success {',
            '  display: none; text-align: center; padding: 32px 16px;',
            '}',
            '#fd-contact-success-msg { color: #2e7d32; font-size: 15px; margin-bottom: 8px; }',
            '#fd-contact-success-sub { color: #666; font-size: 13px; }',

            /* Contact button at bottom */
            '#fd-contact-bar {',
            '  padding: 12px 16px; border-top: 1px solid #e5e5e5;',
            '  flex-shrink: 0; text-align: center;',
            '}',
            '#fd-contact-bar button {',
            '  padding: 9px 20px; background: ' + cfg.widgetColor + ';',
            '  color: #fff; border: none; border-radius: 6px;',
            '  font-size: 14px; cursor: pointer; width: 100%;',
            '}',

            /* Screenshot attachment */
            '#fd-screenshot-area { margin-top: 4px; }',
            '#fd-screenshot-attach {',
            '  background: none; border: 1px dashed #ccc; border-radius: 6px;',
            '  padding: 6px 12px; font-size: 13px; color: #666;',
            '  cursor: pointer; width: 100%; text-align: left; box-sizing: border-box;',
            '}',
            '#fd-screenshot-attach:hover { border-color: #999; color: #333; }',
            '#fd-screenshot-preview-wrap {',
            '  position: relative; margin-top: 8px; display: none;',
            '}',
            '#fd-screenshot-img {',
            '  width: 100%; max-height: 120px; object-fit: contain;',
            '  border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5; display: block;',
            '}',
            '#fd-screenshot-clear {',
            '  position: absolute; top: 4px; right: 4px;',
            '  background: rgba(0,0,0,0.55); color: #fff; border: none;',
            '  border-radius: 4px; padding: 2px 8px; font-size: 12px; cursor: pointer;',
            '}',
            '#fd-screenshot-hint { font-size: 11px; color: #999; margin: 4px 0 0; }',

            /* Responsive */
            '@media (max-width: 600px) {',
            '  #fd-modal { width: 98vw; height: 95vh; border-radius: 6px; }',
            '  #fd-help-btn { bottom: 16px; right: 16px; }',
            '}',
        ].join('\n');

        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // -------------------------------------------------------------------------
    // Build modal DOM
    // -------------------------------------------------------------------------
    function buildModal() {
        var overlay = document.createElement('div');
        overlay.id = 'fd-modal-overlay';

        var modal = document.createElement('div');
        modal.id = 'fd-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'SCCA Support');

        modal.innerHTML = [
            '<div id="fd-modal-header">',
            '  <h2>&#128587; SCCA Support</h2>',
            '  <button id="fd-modal-close" aria-label="Close support widget">&times;</button>',
            '</div>',

            '<div id="fd-search-panel">',
            '  <div id="fd-search-row">',
            '    <input id="fd-search-input" type="text"',
            '           placeholder="Search help articles..."',
            '           aria-label="Search help articles"/>',
            '    <button id="fd-search-btn">Search</button>',
            '  </div>',
            '</div>',

            '<div id="fd-results">',
            '  <div id="fd-status">Search for help articles above, or contact support below.</div>',
            '  <div id="fd-articles"></div>',

            '  <div id="fd-article-view">',
            '    <div id="fd-article-back">',
            '      <button id="fd-article-back-btn">&#8592; Back to results</button>',
            '      <button id="fd-article-open-btn">Open full article &#8599;</button>',
            '    </div>',
            '    <div id="fd-article-content"></div>',
            '  </div>',

            '  <div id="fd-contact-form">',
            '    <div id="fd-contact-form-back">',
            '      <button id="fd-contact-back-btn">&#8592; Back</button>',
            '    </div>',
            '    <div id="fd-contact-success">',
            '      <p id="fd-contact-success-msg">&#10003; Your ticket has been submitted!</p>',
            '      <p id="fd-contact-success-sub">We\'ll reply to your registered email address.</p>',
            '    </div>',
            '    <div id="fd-contact-fields">',
            '      <div id="fd-contact-userinfo"></div>',
            '      <div id="fd-suggest-section" style="display:none;">',
            '        <p id="fd-suggest-heading">Related articles — did you find what you need?</p>',
            '        <div id="fd-suggest-articles"></div>',
            '      </div>',
            '      <div>',
            '        <label for="fd-ticket-subject">Subject</label>',
            '        <input id="fd-ticket-subject" type="text" maxlength="255" />',
            '      </div>',
            '      <div>',
            '        <label for="fd-ticket-message">How can we help?</label>',
            '        <textarea id="fd-ticket-message" placeholder="Describe your issue..."></textarea>',
            '      </div>',
            '      <div id="fd-screenshot-area">',
            '        <button type="button" id="fd-screenshot-attach">&#128247; Attach screenshot</button>',
            '        <input id="fd-screenshot-file" type="file" accept="image/*" style="display:none;" />',
            '        <div id="fd-screenshot-preview-wrap">',
            '          <img id="fd-screenshot-img" alt="Screenshot preview" />',
            '          <button type="button" id="fd-screenshot-clear">&times; Remove</button>',
            '        </div>',
            '        <p id="fd-screenshot-hint">You can also paste (Ctrl+V / \u2318V) a screenshot.</p>',
            '      </div>',
            '      <p id="fd-contact-error"></p>',
            '      <p id="fd-privacy-notice">By submitting, your name, email address, and page context',
            '        will be sent to our support platform (Freshdesk) to process your request.</p>',
            '      <button id="fd-contact-submit">Send</button>',
            '    </div>',
            '  </div>',
            '</div>',

            '<div id="fd-contact-bar">',
            '  <button id="fd-contact-btn">&#9993; Contact Support</button>',
            '</div>',
        ].join('');

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        return overlay;
    }

    // -------------------------------------------------------------------------
    // Help button
    // -------------------------------------------------------------------------
    function buildHelpButton() {
        var btn = document.createElement('button');
        btn.id = 'fd-help-btn';
        btn.innerHTML = '&#128587; Get Help';
        btn.setAttribute('aria-label', 'Open SCCA support widget');
        document.body.appendChild(btn);
        return btn;
    }

    // -------------------------------------------------------------------------
    // API: search articles (proxied server-side — API key never reaches browser)
    // -------------------------------------------------------------------------
    function searchArticles(term, callback) {
        Ajax.call([{
            methodname: 'local_freshdesk_search_articles',
            args: {term: term},
        }])[0].then(function(results) {
            callback(null, results || []);
            return results;
        }).catch(function() {
            callback('API error', []);
        });
    }

    // -------------------------------------------------------------------------
    // API: get single article (proxied server-side — API key never reaches browser)
    // -------------------------------------------------------------------------
    function getArticle(articleId, callback) {
        Ajax.call([{
            methodname: 'local_freshdesk_get_article',
            args: {articleid: articleId},
        }])[0].then(function(article) {
            if (!article || !article.id) {
                callback('Not found', null);
                return article;
            }
            callback(null, article);
            return article;
        }).catch(function() {
            callback('API error', null);
        });
    }

    // -------------------------------------------------------------------------
    // Render article list
    // -------------------------------------------------------------------------
    function renderArticles(articles) {
        var articlesDiv = document.getElementById('fd-articles');
        var status      = document.getElementById('fd-status');

        if (!articles || articles.length === 0) {
            status.textContent = 'No articles found. Try different keywords or contact support below.';
            articlesDiv.innerHTML = '';
            return;
        }

        status.style.display = 'none';
        articlesDiv.innerHTML = '';

        articles.slice(0, 8).forEach(function(article) {
            var item = document.createElement('div');
            item.className = 'fd-article-item';

            var title = document.createElement('a');
            title.className = 'fd-article-title';
            title.href = '#';
            title.textContent = article.title || 'Untitled';
            title.addEventListener('click', function(e) {
                e.preventDefault();
                showArticle(
                    article.id,
                    article.title,
                    cfg.portalUrl + '/support/solutions/articles/' + article.id
                );
            });

            var desc = document.createElement('p');
            desc.className = 'fd-article-desc';
            var tmp = document.createElement('div');
            tmp.innerHTML = article.description_text || article.description || '';
            desc.textContent = (tmp.textContent || '').substring(0, 120) + '...';

            item.appendChild(title);
            item.appendChild(desc);
            articlesDiv.appendChild(item);
        });
    }

    // -------------------------------------------------------------------------
    // Show single article inline
    // -------------------------------------------------------------------------
    function showArticle(articleId, articleTitle, fullUrl) {
        var articleView    = document.getElementById('fd-article-view');
        var articleContent = document.getElementById('fd-article-content');
        var openBtn        = document.getElementById('fd-article-open-btn');

        document.getElementById('fd-articles').style.display      = 'none';
        document.getElementById('fd-status').style.display        = 'none';
        document.getElementById('fd-contact-form').style.display  = 'none';
        articleView.style.display = 'flex';

        articleContent.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Loading...</p>';

        openBtn.onclick = function() {
            window.open(fullUrl, '_blank');
        };

        getArticle(articleId, function(err, data) {
            if (err || !data) {
                articleContent.innerHTML = '<p style="color:#c00;">Could not load article. ' +
                    '<a href="' + fullUrl + '" target="_blank">Open in Freshdesk</a></p>';
                return;
            }
            articleContent.innerHTML = data.description || '<p>No content available.</p>';
        });
    }

    // -------------------------------------------------------------------------
    // Extract search terms from course name AND URL activity type (both if available)
    // -------------------------------------------------------------------------
    function getSearchTerms() {
        var terms = [];
        if (cfg.courseName) {
            terms.push(cfg.courseName);
        }
        if (cfg.currentUrl) {
            try {
                var parts = new URL(cfg.currentUrl).pathname.split('/').filter(Boolean);
                var modIdx = parts.indexOf('mod');
                if (modIdx !== -1 && parts[modIdx + 1]) {
                    var activityType = parts[modIdx + 1];
                    if (terms.indexOf(activityType) === -1) {
                        terms.push(activityType);
                    }
                } else if (terms.length === 0 && parts[0]) {
                    terms.push(parts[0]);
                }
            } catch(e) {}
        }
        return terms;
    }

    // -------------------------------------------------------------------------
    // Search with multiple terms in parallel, merge and deduplicate results
    // -------------------------------------------------------------------------
    function searchArticlesMulti(terms, callback) {
        if (!terms || terms.length === 0) {
            callback(null, []);
            return;
        }
        if (terms.length === 1) {
            searchArticles(terms[0], callback);
            return;
        }
        var merged    = [];
        var seenIds   = {};
        var remaining = terms.length;
        var firstErr  = null;
        terms.forEach(function(term) {
            searchArticles(term, function(err, results) {
                if (err && !firstErr) { firstErr = err; }
                if (results) {
                    results.forEach(function(article) {
                        if (!seenIds[article.id]) {
                            seenIds[article.id] = true;
                            merged.push(article);
                        }
                    });
                }
                remaining--;
                if (remaining === 0) {
                    callback(merged.length === 0 ? firstErr : null, merged);
                }
            });
        });
    }

    // -------------------------------------------------------------------------
    // Show native contact form panel
    // -------------------------------------------------------------------------
    function showContactForm() {
        document.getElementById('fd-search-panel').style.display  = 'none';
        document.getElementById('fd-contact-bar').style.display   = 'none';
        document.getElementById('fd-status').style.display        = 'none';
        document.getElementById('fd-articles').style.display      = 'none';
        document.getElementById('fd-article-view').style.display  = 'none';

        // Show who the ticket will be submitted as, with username and profile link.
        var userInfoEl = document.getElementById('fd-contact-userinfo');
        userInfoEl.innerHTML = '';
        if (cfg.userName) {
            var nameText = document.createTextNode('Submitting as ');
            var nameStrong = document.createElement('strong');
            nameStrong.textContent = cfg.userName;
            if (cfg.userUsername) {
                nameStrong.textContent += ' (' + cfg.userUsername + ')';
            }
            userInfoEl.appendChild(nameText);
            userInfoEl.appendChild(nameStrong);

            if (cfg.userProfileUrl) {
                userInfoEl.appendChild(document.createTextNode('\u00a0\u00a0'));
                var profileLink = document.createElement('a');
                profileLink.href             = cfg.userProfileUrl;
                profileLink.target           = '_blank';
                profileLink.rel              = 'noopener noreferrer';
                profileLink.textContent      = 'View profile \u2197';
                profileLink.style.fontSize   = '12px';
                profileLink.style.color      = cfg.widgetColor;
                profileLink.style.fontWeight = 'normal';
                userInfoEl.appendChild(profileLink);
            }
            userInfoEl.style.display = '';
        } else {
            userInfoEl.style.display = 'none';
        }

        // Pre-fill subject on first open.
        var subjectInput = document.getElementById('fd-ticket-subject');
        if (subjectInput && !subjectInput.value) {
            var subject = 'Support request';
            if (cfg.courseName) {
                subject += ' - ' + cfg.courseName;
            }
            if (cfg.userRole) {
                subject += ' [' + cfg.userRole + ']';
            }
            subjectInput.value = subject;
        }

        document.getElementById('fd-contact-form').style.display = 'flex';
        document.getElementById('fd-ticket-message').focus();

        // Auto-suggest articles based on current context.
        loadSuggestedArticles();
    }

    // -------------------------------------------------------------------------
    // Auto-suggest articles in the contact form panel (inline, new-tab links)
    // -------------------------------------------------------------------------
    function loadSuggestedArticles() {
        if (!cfg.portalUrl) { return; }
        var terms = getSearchTerms();
        if (!terms.length) { return; }

        var section     = document.getElementById('fd-suggest-section');
        var articlesDiv = document.getElementById('fd-suggest-articles');

        section.style.display = 'block';
        articlesDiv.innerHTML = '<p style="color:#999;font-size:12px;margin:0;">Loading suggestions...</p>';

        searchArticlesMulti(terms, function(err, results) {
            if (err || !results || results.length === 0) {
                section.style.display = 'none';
                return;
            }
            articlesDiv.innerHTML = '';
            results.slice(0, 3).forEach(function(article) {
                var item = document.createElement('div');
                item.className = 'fd-suggest-item';

                var link = document.createElement('a');
                link.className   = 'fd-suggest-link';
                link.textContent = article.title || 'Untitled';
                link.href        = cfg.portalUrl + '/support/solutions/articles/' + article.id;
                link.target      = '_blank';
                link.rel         = 'noopener noreferrer';

                item.appendChild(link);
                articlesDiv.appendChild(item);
            });
        });
    }

    // -------------------------------------------------------------------------
    // Auto-suggest articles on the main modal home screen
    // -------------------------------------------------------------------------
    function loadPageSuggestions() {
        if (!cfg.portalUrl) { return; }
        var terms = getSearchTerms();
        if (!terms.length) { return; }

        var status = document.getElementById('fd-status');
        status.textContent = 'Loading suggestions\u2026';

        searchArticlesMulti(terms, function(err, results) {
            if (err || !results || results.length === 0) {
                status.textContent = 'Search for help articles above, or contact support below.';
                return;
            }
            status.textContent = 'Suggested for this page:';
            renderArticles(results);
        });
    }

    // -------------------------------------------------------------------------
    // Process an image file into a compressed JPEG and store as screenshotData
    // -------------------------------------------------------------------------
    function processScreenshotFile(file) {
        var reader = new FileReader();
        reader.onload = function(ev) {
            var img = new Image();
            img.onload = function() {
                var maxW   = 1280;
                var scale  = img.width > maxW ? maxW / img.width : 1;
                var canvas = document.createElement('canvas');
                canvas.width  = Math.round(img.width  * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                // Store only the base64 part (strip the data URL prefix).
                screenshotData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                var previewWrap = document.getElementById('fd-screenshot-preview-wrap');
                var previewImg  = document.getElementById('fd-screenshot-img');
                previewImg.src            = 'data:image/jpeg;base64,' + screenshotData;
                previewWrap.style.display = 'block';
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    // -------------------------------------------------------------------------
    // Submit ticket via Moodle AJAX (server-side Freshdesk API proxy)
    // -------------------------------------------------------------------------
    function submitTicket() {
        var subject   = document.getElementById('fd-ticket-subject').value.trim();
        var message   = document.getElementById('fd-ticket-message').value.trim();
        var errorEl   = document.getElementById('fd-contact-error');
        var submitBtn = document.getElementById('fd-contact-submit');

        errorEl.style.display = 'none';

        if (!subject) {
            errorEl.textContent = 'Please enter a subject.';
            errorEl.style.display = 'block';
            return;
        }
        if (!message) {
            errorEl.textContent = 'Please describe your issue.';
            errorEl.style.display = 'block';
            return;
        }

        submitBtn.disabled    = true;
        submitBtn.textContent = 'Sending...';

        Ajax.call([{
            methodname: 'local_freshdesk_submit_ticket',
            args: {
                subject:    subject,
                message:    message,
                currenturl: cfg.currentUrl   || '',
                coursename: cfg.courseName   || '',
                userrole:   cfg.userRole     || '',
                screenshot: screenshotData   || '',
            }
        }])[0].then(function(result) {
            if (result.success) {
                document.getElementById('fd-contact-fields').style.display  = 'none';
                document.getElementById('fd-contact-success').style.display = 'block';
            }
            return result;
        }).catch(function(err) {
            window.console.error('local_freshdesk: ticket submission failed: ' + JSON.stringify(err));
            errorEl.textContent   = 'Failed to submit ticket. Please try again.';
            errorEl.style.display = 'block';
            submitBtn.disabled    = false;
            submitBtn.textContent = 'Send';
        });
    }

    // -------------------------------------------------------------------------
    // Reset modal to default state
    // -------------------------------------------------------------------------
    function resetModal() {
        document.getElementById('fd-articles').style.display        = '';
        document.getElementById('fd-articles').innerHTML             = '';
        document.getElementById('fd-status').style.display          = '';
        document.getElementById('fd-status').textContent            =
            'Search for help articles above, or contact support below.';
        document.getElementById('fd-article-view').style.display    = 'none';
        document.getElementById('fd-contact-form').style.display    = 'none';
        document.getElementById('fd-contact-bar').style.display     = '';
        document.getElementById('fd-search-panel').style.display    = '';
        document.getElementById('fd-search-input').value            = '';

        // Reset contact form state.
        document.getElementById('fd-ticket-subject').value           = '';
        document.getElementById('fd-ticket-message').value           = '';
        document.getElementById('fd-contact-error').style.display    = 'none';
        document.getElementById('fd-contact-fields').style.display   = '';
        document.getElementById('fd-contact-success').style.display  = 'none';
        document.getElementById('fd-suggest-section').style.display  = 'none';
        document.getElementById('fd-suggest-articles').innerHTML     = '';
        var submitBtn = document.getElementById('fd-contact-submit');
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Send';

        // Reset screenshot state.
        screenshotData = null;
        document.getElementById('fd-screenshot-preview-wrap').style.display = 'none';
        document.getElementById('fd-screenshot-img').src = '';
        document.getElementById('fd-screenshot-file').value = '';
    }

    // -------------------------------------------------------------------------
    // Wire up events
    // -------------------------------------------------------------------------
    function wireEvents(overlay) {
        var helpBtn        = document.getElementById('fd-help-btn');
        var closeBtn       = document.getElementById('fd-modal-close');
        var searchBtn      = document.getElementById('fd-search-btn');
        var searchInput    = document.getElementById('fd-search-input');
        var contactBtn     = document.getElementById('fd-contact-btn');
        var artBackBtn     = document.getElementById('fd-article-back-btn');
        var contactBackBtn = document.getElementById('fd-contact-back-btn');
        var submitBtn      = document.getElementById('fd-contact-submit');

        helpBtn.addEventListener('click', function() {
            overlay.style.display = 'block';
            searchInput.focus();
            loadPageSuggestions();
        });

        function closeModal() {
            overlay.style.display = 'none';
            resetModal();
        }
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) { closeModal(); }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.style.display === 'block') { closeModal(); }
        });

        function doSearch() {
            var term = searchInput.value.trim();
            if (!term) { return; }
            var status = document.getElementById('fd-status');
            status.style.display = '';
            status.textContent   = 'Searching...';
            document.getElementById('fd-articles').innerHTML = '';
            document.getElementById('fd-article-view').style.display  = 'none';
            document.getElementById('fd-contact-form').style.display  = 'none';

            searchArticles(term, function(err, results) {
                if (err) {
                    status.textContent = 'Search unavailable. Please contact support below.';
                    return;
                }
                renderArticles(results);
            });
        }

        searchBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { doSearch(); }
        });

        contactBtn.addEventListener('click', showContactForm);

        contactBackBtn.addEventListener('click', function() {
            document.getElementById('fd-contact-form').style.display  = 'none';
            document.getElementById('fd-search-panel').style.display  = '';
            document.getElementById('fd-contact-bar').style.display   = '';
            document.getElementById('fd-status').style.display        = '';
        });

        submitBtn.addEventListener('click', submitTicket);

        // Screenshot: file picker.
        var screenshotAttachBtn = document.getElementById('fd-screenshot-attach');
        var screenshotFileInput = document.getElementById('fd-screenshot-file');
        var screenshotClearBtn  = document.getElementById('fd-screenshot-clear');

        screenshotAttachBtn.addEventListener('click', function() {
            screenshotFileInput.click();
        });

        screenshotFileInput.addEventListener('change', function() {
            if (screenshotFileInput.files.length > 0) {
                processScreenshotFile(screenshotFileInput.files[0]);
            }
        });

        screenshotClearBtn.addEventListener('click', function() {
            screenshotData = null;
            document.getElementById('fd-screenshot-preview-wrap').style.display = 'none';
            document.getElementById('fd-screenshot-img').src = '';
            screenshotFileInput.value = '';
        });

        // Screenshot: clipboard paste (image only; text paste in inputs is unaffected).
        document.addEventListener('paste', function(e) {
            if (overlay.style.display !== 'block') { return; }
            var items = e.clipboardData && e.clipboardData.items;
            if (!items) { return; }
            var i;
            for (i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    processScreenshotFile(items[i].getAsFile());
                    e.preventDefault();
                    break;
                }
            }
        });

        artBackBtn.addEventListener('click', function() {
            document.getElementById('fd-article-view').style.display = 'none';
            document.getElementById('fd-articles').style.display     = '';
            document.getElementById('fd-status').style.display       = 'none';
        });
    }

    // -------------------------------------------------------------------------
    // Entry point
    // -------------------------------------------------------------------------
    return {
        /**
         * Initialise the widget. Called by Moodle's AMD loader via js_call_amd.
         * Reads configuration from window.local_freshdesk_config (injected
         * by the before_footer hook), builds the modal DOM, and wires events.
         */
        init: function() {
            cfg = window.local_freshdesk_config || {};

            if (!cfg.portalUrl) {
                console.warn('local_freshdesk: missing config, widget not loaded.');
                return;
            }

            injectStyles();
            var overlay = buildModal();
            buildHelpButton();
            wireEvents(overlay);
        }
    };
});
