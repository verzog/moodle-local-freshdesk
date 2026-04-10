/**
 * Freshdesk Support Widget for Moodle
 * local_freshdeskwidget/widget
 *
 * Renders a floating Help button that opens a modal containing:
 * - A search box that queries the Freshdesk knowledge base via REST API
 * - Article results displayed inline
 * - A fallback contact form (iframe to Freshdesk portal)
 */
define(['core/config'], function(mdlConfig) {

    var cfg = {};

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

            /* Contact form iframe */
            '#fd-form-panel { display: none; flex-direction: column; height: 100%; }',
            '#fd-form-back {',
            '  padding: 10px 16px; background: #f5f5f5;',
            '  border-bottom: 1px solid #e5e5e5; flex-shrink: 0;',
            '}',
            '#fd-form-back button {',
            '  background: none; border: none; color: ' + cfg.widgetColor + ';',
            '  font-size: 13px; cursor: pointer; padding: 0;',
            '}',
            '#fd-form-iframe {',
            '  flex: 1; border: none; width: 100%;',
            '}',

            /* Status messages */
            '#fd-status {',
            '  padding: 16px; text-align: center;',
            '  color: #666; font-size: 14px;',
            '}',

            /* Contact button at bottom of results */
            '#fd-contact-bar {',
            '  padding: 12px 16px; border-top: 1px solid #e5e5e5;',
            '  flex-shrink: 0; text-align: center;',
            '}',
            '#fd-contact-bar button {',
            '  padding: 9px 20px; background: ' + cfg.widgetColor + ';',
            '  color: #fff; border: none; border-radius: 6px;',
            '  font-size: 14px; cursor: pointer; width: 100%;',
            '}',

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
        // Overlay
        var overlay = document.createElement('div');
        overlay.id = 'fd-modal-overlay';

        // Modal
        var modal = document.createElement('div');
        modal.id = 'fd-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'SCCA Support');

        // Header
        modal.innerHTML = [
            '<div id="fd-modal-header">',
            '  <h2>&#128587; SCCA Support</h2>',
            '  <button id="fd-modal-close" aria-label="Close support widget">&times;</button>',
            '</div>',

            // Search panel
            '<div id="fd-search-panel">',
            '  <div id="fd-search-row">',
            '    <input id="fd-search-input" type="text" placeholder="Search help articles..." aria-label="Search help articles"/>',
            '    <button id="fd-search-btn">Search</button>',
            '  </div>',
            '</div>',

            // Results area
            '<div id="fd-results">',
            '  <div id="fd-status">Search for help articles above, or contact support below.</div>',
            '  <div id="fd-articles"></div>',

            '  <!-- Full article view -->',
            '  <div id="fd-article-view">',
            '    <div id="fd-article-back">',
            '      <button id="fd-article-back-btn">&#8592; Back to results</button>',
            '      <button id="fd-article-open-btn">Open full article &#8599;</button>',
            '    </div>',
            '    <div id="fd-article-content"></div>',
            '  </div>',

            '  <!-- Contact form -->',
            '  <div id="fd-form-panel">',
            '    <div id="fd-form-back">',
            '      <button id="fd-form-back-btn">&#8592; Back to results</button>',
            '    </div>',
            '    <iframe id="fd-form-iframe" title="Contact Support Form" src=""></iframe>',
            '  </div>',
            '</div>',

            // Contact bar
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
    // API: search articles
    // -------------------------------------------------------------------------
    function searchArticles(term, callback) {
        var url = cfg.portalUrl + '/api/v2/search/solutions?term=' + encodeURIComponent(term);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(cfg.apiKey + ':X'));
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        callback(null, data.results || data || []);
                    } catch(e) {
                        callback('Parse error', []);
                    }
                } else {
                    callback('API error ' + xhr.status, []);
                }
            }
        };
        xhr.send();
    }

    // -------------------------------------------------------------------------
    // API: get single article
    // -------------------------------------------------------------------------
    function getArticle(articleId, callback) {
        var url = cfg.portalUrl + '/api/v2/solutions/articles/' + articleId;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(cfg.apiKey + ':X'));
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        callback(null, JSON.parse(xhr.responseText));
                    } catch(e) {
                        callback('Parse error', null);
                    }
                } else {
                    callback('API error ' + xhr.status, null);
                }
            }
        };
        xhr.send();
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
                showArticle(article.id, article.title, cfg.portalUrl + '/support/solutions/articles/' + article.id);
            });

            var desc = document.createElement('p');
            desc.className = 'fd-article-desc';
            // Strip HTML tags from description snippet
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
        var articleView   = document.getElementById('fd-article-view');
        var articleContent= document.getElementById('fd-article-content');
        var openBtn       = document.getElementById('fd-article-open-btn');
        var results       = document.getElementById('fd-results');

        // Hide article list, show article view
        document.getElementById('fd-articles').style.display = 'none';
        document.getElementById('fd-status').style.display   = 'none';
        articleView.style.display = 'flex';

        articleContent.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Loading...</p>';

        // Wire up open full article button
        openBtn.onclick = function() {
            window.open(fullUrl, '_blank');
        };

        getArticle(articleId, function(err, data) {
            if (err || !data) {
                articleContent.innerHTML = '<p style="color:#c00;">Could not load article. <a href="' + fullUrl + '" target="_blank">Open in Freshdesk</a></p>';
                return;
            }
            articleContent.innerHTML = data.description || '<p>No content available.</p>';
        });
    }

    // -------------------------------------------------------------------------
    // Show contact form
    // -------------------------------------------------------------------------
    function showContactForm() {
        var formPanel  = document.getElementById('fd-form-panel');
        var formIframe = document.getElementById('fd-form-iframe');
        var articles   = document.getElementById('fd-articles');
        var status     = document.getElementById('fd-status');
        var contactBar = document.getElementById('fd-contact-bar');
        var articleView= document.getElementById('fd-article-view');
        var searchPanel= document.getElementById('fd-search-panel');

        // Hide everything else, show form
        articles.style.display    = 'none';
        status.style.display      = 'none';
        articleView.style.display = 'none';
        contactBar.style.display  = 'none';
        searchPanel.style.display = 'none';
        formPanel.style.display   = 'flex';

        // Only set src if not already loaded
        if (!formIframe.src || formIframe.src === window.location.href) {
            formIframe.src = cfg.ticketFormUrl;
        }
    }

    // -------------------------------------------------------------------------
    // Reset modal to default state
    // -------------------------------------------------------------------------
    function resetModal() {
        document.getElementById('fd-articles').style.display    = '';
        document.getElementById('fd-articles').innerHTML        = '';
        document.getElementById('fd-status').style.display      = '';
        document.getElementById('fd-status').textContent        = 'Search for help articles above, or contact support below.';
        document.getElementById('fd-article-view').style.display= 'none';
        document.getElementById('fd-form-panel').style.display  = 'none';
        document.getElementById('fd-contact-bar').style.display = '';
        document.getElementById('fd-search-panel').style.display= '';
        document.getElementById('fd-search-input').value        = '';
        document.getElementById('fd-form-iframe').src           = '';
    }

    // -------------------------------------------------------------------------
    // Wire up events
    // -------------------------------------------------------------------------
    function wireEvents(overlay) {
        var helpBtn    = document.getElementById('fd-help-btn');
        var closeBtn   = document.getElementById('fd-modal-close');
        var searchBtn  = document.getElementById('fd-search-btn');
        var searchInput= document.getElementById('fd-search-input');
        var contactBtn = document.getElementById('fd-contact-btn');
        var formBackBtn= document.getElementById('fd-form-back-btn');
        var artBackBtn = document.getElementById('fd-article-back-btn');

        // Open modal
        helpBtn.addEventListener('click', function() {
            overlay.style.display = 'block';
            searchInput.focus();
        });

        // Close modal
        function closeModal() {
            overlay.style.display = 'none';
            resetModal();
        }
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) { closeModal(); }
        });

        // Close on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.style.display === 'block') {
                closeModal();
            }
        });

        // Search
        function doSearch() {
            var term = searchInput.value.trim();
            if (!term) { return; }
            var status = document.getElementById('fd-status');
            status.style.display  = '';
            status.textContent    = 'Searching...';
            document.getElementById('fd-articles').innerHTML = '';
            document.getElementById('fd-article-view').style.display = 'none';

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

        // Contact support
        contactBtn.addEventListener('click', showContactForm);

        // Back from form
        formBackBtn.addEventListener('click', function() {
            document.getElementById('fd-form-panel').style.display   = 'none';
            document.getElementById('fd-articles').style.display     = '';
            document.getElementById('fd-status').style.display       = '';
            document.getElementById('fd-contact-bar').style.display  = '';
            document.getElementById('fd-search-panel').style.display = '';
        });

        // Back from article
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
        init: function() {
            // Read config passed from PHP
            cfg = window.local_freshdeskwidget_config || {};

            if (!cfg.portalUrl || !cfg.apiKey) {
                console.warn('local_freshdeskwidget: missing config, widget not loaded.');
                return;
            }

            injectStyles();
            var overlay = buildModal();
            buildHelpButton();
            wireEvents(overlay);
        }
    };
});
