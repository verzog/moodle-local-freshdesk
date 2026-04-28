/**
 * Freshdesk Support Widget for Moodle.
 *
 * Renders a floating Help button that opens a modal containing:
 *  - Auto-suggested knowledge base articles on open (course name + activity type)
 *  - A search box that queries the Freshdesk knowledge base via the server proxy
 *  - Inline article viewer with option to open the full article in Freshdesk
 *  - A native contact form that submits tickets via Moodle AJAX (server-side proxy)
 *  - Optional screenshot attachment via file upload or clipboard paste
 *
 * UI markup is rendered from Mustache templates (templates/modal.mustache and
 * templates/help_button.mustache); UI text comes from lang/en/local_freshdesk.php
 * via core/str.
 *
 * @module     local_freshdesk/widget
 * @copyright  2026 verzog
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['core/ajax', 'core/templates', 'core/str'], function(Ajax, Templates, Str) {

    /** @type {Object} Plugin configuration passed from PHP via data_for_js. */
    var cfg = {};

    /** @type {Object} Pre-translated UI strings keyed by identifier. */
    var strs = {};

    /** @type {string|null} Base64-encoded JPEG screenshot, or null when not set. */
    var screenshotData = null;

    /** Identifiers of the language strings the widget needs at runtime. */
    var STRING_KEYS = [
        'articleloaderror', 'attachscreenshot', 'back', 'backtoresults',
        'close', 'contactsupport', 'errormessage', 'errorsubject', 'gethelp',
        'initialprompt', 'loadingarticle', 'loadingsuggestions',
        'messagelabel', 'messageplaceholder', 'modaltitle', 'noarticles',
        'nocontent', 'openfullarticle', 'openinfreshdesk', 'openportal',
        'openwidget', 'privacynotice', 'relatedheading', 'removescreenshot',
        'screenshothint', 'searchbutton', 'searching', 'searchplaceholder',
        'searchunavailable', 'send', 'sending', 'submittingas',
        'suggestedheading', 'supportrequest', 'ticketreply',
        'ticketsubmiterror', 'ticketsubmitted', 'subjectlabel', 'viewprofile'
    ];

    function injectStyles() {
        var css = [
            '#fd-help-btn {',
            '  position: fixed; bottom: 24px; right: 24px; z-index: 9998;',
            '  background: ' + cfg.widgetColor + '; color: #fff;',
            '  border: none; border-radius: 24px;',
            '  padding: 12px 20px; font-size: 15px; font-weight: 600;',
            '  cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.25);',
            '  transition: background 0.2s;',
            '  text-decoration: none; display: inline-block; line-height: 1;',
            '}',
            '#fd-help-btn:hover { filter: brightness(1.1); color: #fff; text-decoration: none; }',
            '#fd-modal-overlay {',
            '  display: none; position: fixed; top: 0; left: 0;',
            '  width: 100%; height: 100%;',
            '  background: rgba(0,0,0,0.5); z-index: 9999;',
            '}',
            '#fd-modal {',
            '  position: absolute; top: 50%; left: 50%;',
            '  transform: translate(-50%, -50%);',
            '  width: 580px; max-width: 95vw;',
            '  height: 700px; max-height: 90vh;',
            '  background: #fff; border-radius: 10px;',
            '  overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3);',
            '  display: flex; flex-direction: column;',
            '}',
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
            '#fd-search-panel {',
            '  padding: 14px 16px; border-bottom: 1px solid #e5e5e5;',
            '  flex-shrink: 0;',
            '}',
            '#fd-search-row { display: flex; gap: 8px; }',
            '#fd-search-input {',
            '  flex: 1; padding: 8px 12px; border: 1px solid #ccc;',
            '  border-radius: 6px; font-size: 14px;',
            '}',
            '#fd-search-btn {',
            '  padding: 8px 14px; background: ' + cfg.widgetColor + ';',
            '  color: #fff; border: none; border-radius: 6px;',
            '  font-size: 14px; cursor: pointer;',
            '}',
            '#fd-results {',
            '  flex: 1; overflow-y: auto; padding: 0;',
            '  display: flex; flex-direction: column;',
            '}',
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
            '.fd-article-desc { font-size: 13px; color: #555; margin: 0; }',
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
            '#fd-status {',
            '  padding: 16px; text-align: center;',
            '  color: #666; font-size: 14px;',
            '}',
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
            '#fd-contact-bar {',
            '  padding: 12px 16px; border-top: 1px solid #e5e5e5;',
            '  flex-shrink: 0; text-align: center;',
            '}',
            '#fd-contact-bar button {',
            '  padding: 9px 20px; background: ' + cfg.widgetColor + ';',
            '  color: #fff; border: none; border-radius: 6px;',
            '  font-size: 14px; cursor: pointer; width: 100%;',
            '}',
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
            '@media (max-width: 600px) {',
            '  #fd-modal { width: 98vw; height: 95vh; border-radius: 6px; }',
            '  #fd-help-btn { bottom: 16px; right: 16px; }',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    function searchArticles(term, callback) {
        Ajax.call([{
            methodname: 'local_freshdesk_search_articles',
            args: {term: term}
        }])[0].then(function(results) {
            callback(null, results || []);
            return results;
        }).catch(function() {
            callback('API error', []);
        });
    }

    function getArticle(articleId, callback) {
        Ajax.call([{
            methodname: 'local_freshdesk_get_article',
            args: {articleid: articleId}
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

    function renderArticles(articles) {
        var articlesDiv = document.getElementById('fd-articles');
        var status      = document.getElementById('fd-status');

        if (!articles || articles.length === 0) {
            status.textContent = strs.noarticles;
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
            title.textContent = article.title || '';
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

    function showArticle(articleId, articleTitle, fullUrl) {
        var articleView    = document.getElementById('fd-article-view');
        var articleContent = document.getElementById('fd-article-content');
        var openBtn        = document.getElementById('fd-article-open-btn');

        document.getElementById('fd-articles').style.display      = 'none';
        document.getElementById('fd-status').style.display        = 'none';
        document.getElementById('fd-contact-form').style.display  = 'none';
        articleView.style.display = 'flex';

        articleContent.innerHTML = '';
        var loading = document.createElement('p');
        loading.style.cssText = 'color:#999;text-align:center;padding:20px;';
        loading.textContent = strs.loadingarticle;
        articleContent.appendChild(loading);

        openBtn.onclick = function() {
            window.open(fullUrl, '_blank', 'noopener');
        };

        getArticle(articleId, function(err, data) {
            if (err || !data) {
                articleContent.innerHTML = '';
                var errp = document.createElement('p');
                errp.style.color = '#c00';
                errp.appendChild(document.createTextNode(strs.articleloaderror + ' '));
                var link = document.createElement('a');
                link.href = fullUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = strs.openinfreshdesk;
                errp.appendChild(link);
                articleContent.appendChild(errp);
                return;
            }
            // Freshdesk returns sanitised HTML; render as the article body.
            articleContent.innerHTML = data.description || '';
            if (!data.description) {
                articleContent.textContent = strs.nocontent;
            }
        });
    }

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
            } catch (e) {
                // Malformed URL — skip activity-type extraction.
            }
        }
        return terms;
    }

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

    function showContactForm() {
        document.getElementById('fd-search-panel').style.display  = 'none';
        document.getElementById('fd-contact-bar').style.display   = 'none';
        document.getElementById('fd-status').style.display        = 'none';
        document.getElementById('fd-articles').style.display      = 'none';
        document.getElementById('fd-article-view').style.display  = 'none';

        var userInfoEl = document.getElementById('fd-contact-userinfo');
        userInfoEl.innerHTML = '';
        if (cfg.userName) {
            userInfoEl.appendChild(document.createTextNode(strs.submittingas + ' '));
            var nameStrong = document.createElement('strong');
            nameStrong.textContent = cfg.userName;
            if (cfg.userUsername) {
                nameStrong.textContent += ' (' + cfg.userUsername + ')';
            }
            userInfoEl.appendChild(nameStrong);

            if (cfg.userProfileUrl) {
                userInfoEl.appendChild(document.createTextNode('  '));
                var profileLink = document.createElement('a');
                profileLink.href             = cfg.userProfileUrl;
                profileLink.target           = '_blank';
                profileLink.rel              = 'noopener noreferrer';
                profileLink.textContent      = strs.viewprofile + ' ↗';
                profileLink.style.fontSize   = '12px';
                profileLink.style.color      = cfg.widgetColor;
                profileLink.style.fontWeight = 'normal';
                userInfoEl.appendChild(profileLink);
            }
            userInfoEl.style.display = '';
        } else {
            userInfoEl.style.display = 'none';
        }

        var subjectInput = document.getElementById('fd-ticket-subject');
        if (subjectInput && !subjectInput.value) {
            var subject = strs.supportrequest;
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

        loadSuggestedArticles();
    }

    function loadSuggestedArticles() {
        if (!cfg.portalUrl) { return; }
        var terms = getSearchTerms();
        if (!terms.length) { return; }

        var section     = document.getElementById('fd-suggest-section');
        var articlesDiv = document.getElementById('fd-suggest-articles');

        section.style.display = 'block';
        articlesDiv.innerHTML = '';
        var loadingp = document.createElement('p');
        loadingp.style.cssText = 'color:#999;font-size:12px;margin:0;';
        loadingp.textContent = strs.loadingsuggestions;
        articlesDiv.appendChild(loadingp);

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
                link.textContent = article.title || '';
                link.href        = cfg.portalUrl + '/support/solutions/articles/' + article.id;
                link.target      = '_blank';
                link.rel         = 'noopener noreferrer';

                item.appendChild(link);
                articlesDiv.appendChild(item);
            });
        });
    }

    function loadPageSuggestions() {
        if (!cfg.portalUrl) { return; }
        var terms = getSearchTerms();
        if (!terms.length) { return; }

        var status = document.getElementById('fd-status');
        status.textContent = strs.loadingsuggestions;

        searchArticlesMulti(terms, function(err, results) {
            if (err || !results || results.length === 0) {
                status.textContent = strs.initialprompt;
                return;
            }
            status.textContent = strs.suggestedheading;
            renderArticles(results);
        });
    }

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

    function submitTicket() {
        var subject   = document.getElementById('fd-ticket-subject').value.trim();
        var message   = document.getElementById('fd-ticket-message').value.trim();
        var errorEl   = document.getElementById('fd-contact-error');
        var submitBtn = document.getElementById('fd-contact-submit');

        errorEl.style.display = 'none';

        if (!subject) {
            errorEl.textContent = strs.errorsubject;
            errorEl.style.display = 'block';
            return;
        }
        if (!message) {
            errorEl.textContent = strs.errormessage;
            errorEl.style.display = 'block';
            return;
        }

        submitBtn.disabled    = true;
        submitBtn.textContent = strs.sending;

        Ajax.call([{
            methodname: 'local_freshdesk_submit_ticket',
            args: {
                subject:    subject,
                message:    message,
                currenturl: cfg.currentUrl   || '',
                coursename: cfg.courseName   || '',
                userrole:   cfg.userRole     || '',
                screenshot: screenshotData   || ''
            }
        }])[0].then(function(result) {
            if (result.success) {
                document.getElementById('fd-contact-fields').style.display  = 'none';
                document.getElementById('fd-contact-success').style.display = 'block';
            }
            return result;
        }).catch(function(err) {
            window.console.error('local_freshdesk: ticket submission failed: ' + JSON.stringify(err));
            errorEl.textContent   = strs.ticketsubmiterror;
            errorEl.style.display = 'block';
            submitBtn.disabled    = false;
            submitBtn.textContent = strs.send;
        });
    }

    function resetModal() {
        document.getElementById('fd-articles').style.display        = '';
        document.getElementById('fd-articles').innerHTML            = '';
        document.getElementById('fd-status').style.display          = '';
        document.getElementById('fd-status').textContent            = strs.initialprompt;
        document.getElementById('fd-article-view').style.display    = 'none';
        document.getElementById('fd-contact-form').style.display    = 'none';
        document.getElementById('fd-contact-bar').style.display     = '';
        document.getElementById('fd-search-panel').style.display    = '';
        document.getElementById('fd-search-input').value            = '';

        document.getElementById('fd-ticket-subject').value           = '';
        document.getElementById('fd-ticket-message').value           = '';
        document.getElementById('fd-contact-error').style.display    = 'none';
        document.getElementById('fd-contact-fields').style.display   = '';
        document.getElementById('fd-contact-success').style.display  = 'none';
        document.getElementById('fd-suggest-section').style.display  = 'none';
        document.getElementById('fd-suggest-articles').innerHTML     = '';
        var submitBtn = document.getElementById('fd-contact-submit');
        submitBtn.disabled    = false;
        submitBtn.textContent = strs.send;

        screenshotData = null;
        document.getElementById('fd-screenshot-preview-wrap').style.display = 'none';
        document.getElementById('fd-screenshot-img').src = '';
        document.getElementById('fd-screenshot-file').value = '';
    }

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
            status.textContent   = strs.searching;
            document.getElementById('fd-articles').innerHTML = '';
            document.getElementById('fd-article-view').style.display  = 'none';
            document.getElementById('fd-contact-form').style.display  = 'none';

            searchArticles(term, function(err, results) {
                if (err) {
                    status.textContent = strs.searchunavailable;
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

    function loadStrings() {
        var requests = STRING_KEYS.map(function(key) {
            return {key: key, component: 'local_freshdesk'};
        });
        return Str.get_strings(requests).then(function(values) {
            STRING_KEYS.forEach(function(key, idx) {
                strs[key] = values[idx];
            });
            return strs;
        });
    }

    function renderHelpButton() {
        return Templates.render('local_freshdesk/help_button', {
            label:     strs.gethelp,
            arialabel: strs.openwidget
        }).then(function(html) {
            var wrap = document.createElement('div');
            wrap.innerHTML = html.trim();
            var btn = wrap.firstChild;
            document.body.appendChild(btn);
            return btn;
        });
    }

    function renderPassthroughButton() {
        return Templates.render('local_freshdesk/help_button', {
            label:     strs.gethelp,
            arialabel: strs.openportal,
            href:      cfg.portalUrl + '/support/home'
        }).then(function(html) {
            var wrap = document.createElement('div');
            wrap.innerHTML = html.trim();
            var link = wrap.firstChild;
            document.body.appendChild(link);
            return link;
        });
    }

    function renderModal() {
        return Templates.render('local_freshdesk/modal', {
            str: {
                title:              strs.modaltitle,
                close:              strs.close,
                searchplaceholder:  strs.searchplaceholder,
                searchbutton:       strs.searchbutton,
                initialprompt:      strs.initialprompt,
                backtoresults:      strs.backtoresults,
                openfullarticle:    strs.openfullarticle,
                back:               strs.back,
                ticketsubmitted:    strs.ticketsubmitted,
                ticketreply:        strs.ticketreply,
                subjectlabel:       strs.subjectlabel,
                messagelabel:       strs.messagelabel,
                messageplaceholder: strs.messageplaceholder,
                attachscreenshot:   strs.attachscreenshot,
                removescreenshot:   strs.removescreenshot,
                screenshothint:     strs.screenshothint,
                privacynotice:      strs.privacynotice,
                send:               strs.send,
                relatedheading:     strs.relatedheading,
                contactsupport:     strs.contactsupport
            }
        }).then(function(html) {
            var wrap = document.createElement('div');
            wrap.innerHTML = html.trim();
            var overlay = wrap.firstChild;
            document.body.appendChild(overlay);
            return overlay;
        });
    }

    return {
        /**
         * Initialise the widget. Called by Moodle's AMD loader via js_call_amd.
         * Reads configuration from window.local_freshdesk_config (injected
         * by the before_footer hook), loads UI strings, renders the modal
         * and Help button from Mustache templates, then wires events.
         *
         * @return {Promise}
         */
        init: function() {
            cfg = window.local_freshdesk_config || {};

            if (!cfg.portalUrl) {
                window.console.warn('local_freshdesk: missing config, widget not loaded.');
                return Promise.resolve();
            }

            injectStyles();

            return loadStrings().then(function() {
                // Pass-through mode for users without local/freshdesk:use
                // (guests, not-logged-in, capability denied): render only a
                // styled link to the Freshdesk portal home, no modal, no AJAX.
                if (!cfg.hasCapability) {
                    return renderPassthroughButton();
                }

                // Full widget mode: KB search, article viewer, contact form.
                return Promise.all([renderModal(), renderHelpButton()])
                    .then(function(results) {
                        var overlay = results[0];
                        wireEvents(overlay);
                    });
            });
        }
    };
});
