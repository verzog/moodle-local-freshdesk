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
 * @module      local_freshdesk/widget
 * @copyright   2026 verzog
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['core/ajax', 'core/templates', 'core/str'], function(Ajax, Templates, Str) {

    /** @type {Object} Plugin configuration passed from PHP via data_for_js. */
    let cfg = {};

    /** @type {Object} Pre-translated UI strings keyed by identifier. */
    let strs = {};

    /** @type {string|null} Base64-encoded JPEG screenshot, or null when not set. */
    let screenshotData = null;

    /** Identifiers of the language strings the widget needs at runtime. */
    const STRING_KEYS = [
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

    /**
     * Injects the required CSS styles into the document head.
     */
    const injectStyles = function() {
        const css = [
            '#fd-help-btn {',
            '  position: fixed; bottom: 24px; right: 24px; z-index: 9998;',
            `  background: ${cfg.widgetColor}; color: #fff;`,
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
            `  background: ${cfg.widgetColor}; color: #fff;`,
            '  padding: 14px 16px; display: flex;',
            '  align-items: center; justify-content: space-between;',
            '  flex-shrink: 0;',
            '}',
            '#fd-modal-header h2 { margin: 0; font-size: 17px; font-weight: 600; color: #fff; flex: 1; word-break: break-word; }',
            '#fd-modal-close { background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; padding: 0 4px; }',
            '#fd-search-panel { padding: 14px 16px; border-bottom: 1px solid #e5e5e5; flex-shrink: 0; }',
            '#fd-search-row { display: flex; gap: 8px; }',
            '#fd-search-input { flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }',
            `#fd-search-btn { padding: 8px 14px; background: ${cfg.widgetColor}; color: #fff; border: none; border-radius: 6px; }`,
            '#fd-results { flex: 1; overflow-y: auto; padding: 0; display: flex; flex-direction: column; }',
            '#fd-articles { padding: 8px 16px; }',
            '.fd-article-item { padding: 10px 0; border-bottom: 1px solid #f0f0f0; }',
            `.fd-article-title { font-size: 14px; font-weight: 600; color: ${cfg.widgetColor}; cursor: pointer; }`,
            '.fd-article-desc { font-size: 13px; color: #555; margin: 0; }',
            '#fd-article-view { display: none; flex-direction: column; height: 100%; }',
            '#fd-article-back { padding: 10px 16px; background: #f5f5f5; border-bottom: 1px solid #e5e5e5; display: flex; gap: 10px; }',
            '#fd-article-content { flex: 1; overflow-y: auto; padding: 16px; font-size: 14px; }',
            '#fd-status { padding: 16px; text-align: center; color: #666; font-size: 14px; }',
            '#fd-contact-form { display: none; flex-direction: column; }',
            '#fd-contact-fields { padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }',
            '#fd-suggest-section { background: #f5f8ff; border: 1px solid #dde8ff; border-radius: 6px; padding: 10px 12px; }',
            `#fd-contact-submit { padding: 9px 20px; background: ${cfg.widgetColor}; color: #fff; border: none; border-radius: 6px; }`,
            '#fd-contact-success { display: none; text-align: center; padding: 32px 16px; }',
            '#fd-screenshot-preview-wrap { position: relative; margin-top: 8px; display: none; }',
            '#fd-screenshot-img { width: 100%; max-height: 120px; object-fit: contain; border: 1px solid #ddd; }',
            '@media (max-width: 600px) { #fd-modal { width: 98vw; height: 95vh; } }'
        ].join('\n');

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    };

    /**
     * Search articles in Freshdesk.
     *
     * @param {string} term
     * @returns {Promise}
     */
    const searchArticles = function(term) {
        return Ajax.call([{
            methodname: 'local_freshdesk_search_articles',
            args: {term: term}
        }])[0];
    };

    /**
     * Get a single article from Freshdesk.
     *
     * @param {number} articleId
     * @returns {Promise}
     */
    const getArticle = function(articleId) {
        return Ajax.call([{
            methodname: 'local_freshdesk_get_article',
            args: {articleid: articleId}
        }])[0];
    };

    /**
     * Renders article results into the results panel.
     *
     * @param {Array} articles
     */
    const renderArticles = function(articles) {
        const articlesDiv = document.getElementById('fd-articles');
        const status = document.getElementById('fd-status');

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
    };

    /**
     * Displays a specific article in the viewer panel.
     *
     * @param {number} articleId
     * @param {string} articleTitle
     * @param {string} fullUrl
     */
    const showArticle = function(articleId, articleTitle, fullUrl) {
        const articleView = document.getElementById('fd-article-view');
        const articleContent = document.getElementById('fd-article-content');
        const openBtn = document.getElementById('fd-article-open-btn');

        document.getElementById('fd-articles').style.display = 'none';
        document.getElementById('fd-status').style.display = 'none';
        document.getElementById('fd-contact-form').style.display = 'none';
        articleView.style.display = 'flex';

        articleContent.innerHTML = '';
        const loading = document.createElement('p');
        loading.style.cssText = 'color:#999;text-align:center;padding:20px;';
        loading.textContent = strs.loadingarticle;
        articleContent.appendChild(loading);

        openBtn.onclick = function() {
            window.open(fullUrl, '_blank', 'noopener');
        };

        getArticle(articleId).then(function(data) {
            if (!data || !data.id) {
                throw new Error('Not found');
            }
            articleContent.innerHTML = data.description || strs.nocontent;
            return data;
        }).catch(function() {
            articleContent.innerHTML = '';
            const errp = document.createElement('p');
            errp.style.color = '#c00';
            errp.textContent = strs.articleloaderror + ' ';
            const link = document.createElement('a');
            link.href = fullUrl;
            link.target = '_blank';
            link.textContent = strs.openinfreshdesk;
            errp.appendChild(link);
            articleContent.appendChild(errp);
        });
    };

    /**
     * Extracts search terms from the current page context.
     *
     * @returns {Array}
     */
    const getSearchTerms = function() {
        const terms = [];
        if (cfg.courseName) {
            terms.push(cfg.courseName);
        }
        if (cfg.currentUrl) {
            try {
                const parts = new URL(cfg.currentUrl).pathname.split('/').filter(Boolean);
                const modIdx = parts.indexOf('mod');
                if (modIdx !== -1 && parts[modIdx + 1]) {
                    const activityType = parts[modIdx + 1];
                    if (terms.indexOf(activityType) === -1) {
                        terms.push(activityType);
                    }
                }
            } catch (e) {
                // Ignore malformed URL.
            }
        }
        return terms;
    };

    /**
     * Performs a combined search for multiple terms.
     *
     * @param {Array} terms
     * @returns {Promise}
     */
    const searchArticlesMulti = function(terms) {
        if (!terms || terms.length === 0) {
            return Promise.resolve([]);
        }
        const promises = terms.map(function(term) {
            return searchArticles(term);
        });

        return Promise.all(promises).then(function(resultsArray) {
            const merged = [];
            const seenIds = {};
            resultsArray.forEach(function(results) {
                if (results) {
                    results.forEach(function(article) {
                        if (!seenIds[article.id]) {
                            seenIds[article.id] = true;
                            merged.push(article);
                        }
                    });
                }
            });
            return merged;
        });
    };

    /**
     * Displays the contact/ticket submission form.
     */
    const showContactForm = function() {
        document.getElementById('fd-search-panel').style.display = 'none';
        document.getElementById('fd-contact-bar').style.display = 'none';
        document.getElementById('fd-status').style.display = 'none';
        document.getElementById('fd-articles').style.display = 'none';
        document.getElementById('fd-article-view').style.display = 'none';

        const userInfoEl = document.getElementById('fd-contact-userinfo');
        userInfoEl.innerHTML = '';
        if (cfg.userName) {
            userInfoEl.textContent = strs.submittingas + ' ' + cfg.userName;
            userInfoEl.style.display = '';
        }

        const subjectInput = document.getElementById('fd-ticket-subject');
        if (subjectInput && !subjectInput.value) {
            subjectInput.value = strs.supportrequest + (cfg.courseName ? ' - ' + cfg.courseName : '');
        }

        document.getElementById('fd-contact-form').style.display = 'flex';
        document.getElementById('fd-ticket-message').focus();

        loadSuggestedArticles();
    };

    /**
     * Loads suggested articles based on page context.
     */
    const loadSuggestedArticles = function() {
        const terms = getSearchTerms();
        if (!terms.length) {
            return;
        }

        const section = document.getElementById('fd-suggest-section');
        const articlesDiv = document.getElementById('fd-suggest-articles');

        section.style.display = 'block';
        articlesDiv.innerHTML = strs.loadingsuggestions;

        searchArticlesMulti(terms).then(function(results) {
            if (!results || results.length === 0) {
                section.style.display = 'none';
                return;
            }
            articlesDiv.innerHTML = '';
            results.slice(0, 3).forEach(function(article) {
                const link = document.createElement('a');
                link.className = 'fd-suggest-link';
                link.textContent = article.title;
                link.href = cfg.portalUrl + '/support/solutions/articles/' + article.id;
                link.target = '_blank';
                articlesDiv.appendChild(link);
            });
            return results;
        }).catch(function() {
            section.style.display = 'none';
        });
    };

    /**
     * Loads initial page suggestions when the widget opens.
     */
    const loadPageSuggestions = function() {
        const terms = getSearchTerms();
        if (!terms.length) {
            return;
        }

        const status = document.getElementById('fd-status');
        status.textContent = strs.loadingsuggestions;

        searchArticlesMulti(terms).then(function(results) {
            if (!results || results.length === 0) {
                status.textContent = strs.initialprompt;
            } else {
                status.textContent = strs.suggestedheading;
                renderArticles(results);
            }
            return results;
        }).catch(function() {
            status.textContent = strs.initialprompt;
        });
    };

    /**
     * Processes a file or blob as a screenshot.
     *
     * @param {Blob} file
     */
    const processScreenshotFile = function(file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const maxW = 1280;
                const scale = img.width > maxW ? maxW / img.width : 1;
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                screenshotData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                document.getElementById('fd-screenshot-img').src = 'data:image/jpeg;base64,' + screenshotData;
                document.getElementById('fd-screenshot-preview-wrap').style.display = 'block';
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    /**
     * Submits the ticket via AJAX.
     */
    const submitTicket = function() {
        const subject = document.getElementById('fd-ticket-subject').value.trim();
        const message = document.getElementById('fd-ticket-message').value.trim();
        const errorEl = document.getElementById('fd-contact-error');
        const submitBtn = document.getElementById('fd-contact-submit');

        if (!subject || !message) {
            errorEl.textContent = !subject ? strs.errorsubject : strs.errormessage;
            errorEl.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = strs.sending;

        Ajax.call([{
            methodname: 'local_freshdesk_submit_ticket',
            args: {
                subject: subject,
                message: message,
                currenturl: cfg.currentUrl || '',
                coursename: cfg.courseName || '',
                userrole: cfg.userRole || '',
                screenshot: screenshotData || ''
            }
        }])[0].then(function(result) {
            if (result.success) {
                document.getElementById('fd-contact-fields').style.display = 'none';
                document.getElementById('fd-contact-success').style.display = 'block';
            }
            return result;
        }).catch(function() {
            errorEl.textContent = strs.ticketsubmiterror;
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = strs.send;
        });
    };

    /**
     * Resets the modal state to default.
     */
    const resetModal = function() {
        document.getElementById('fd-articles').style.display = '';
        document.getElementById('fd-status').style.display = '';
        document.getElementById('fd-status').textContent = strs.initialprompt;
        document.getElementById('fd-article-view').style.display = 'none';
        document.getElementById('fd-contact-form').style.display = 'none';
        document.getElementById('fd-search-panel').style.display = '';
        document.getElementById('fd-contact-bar').style.display = '';
        screenshotData = null;
    };

    /**
     * Wires up DOM events.
     *
     * @param {HTMLElement} overlay
     */
    const wireEvents = function(overlay) {
        const helpBtn = document.getElementById('fd-help-btn');
        const closeBtn = document.getElementById('fd-modal-close');
        const searchBtn = document.getElementById('fd-search-btn');
        const searchInput = document.getElementById('fd-search-input');

        helpBtn.addEventListener('click', function() {
            overlay.style.display = 'block';
            searchInput.focus();
            loadPageSuggestions();
        });

        closeBtn.addEventListener('click', function() {
            overlay.style.display = 'none';
            resetModal();
        });

        searchBtn.addEventListener('click', function() {
            const term = searchInput.value.trim();
            if (!term) {
                return;
            }
            document.getElementById('fd-status').textContent = strs.searching;
            searchArticles(term).then(function(results) {
                renderArticles(results);
                return results;
            }).catch(function() {
                document.getElementById('fd-status').textContent = strs.searchunavailable;
            });
        });

        document.getElementById('fd-contact-btn').addEventListener('click', showContactForm);
        document.getElementById('fd-contact-submit').addEventListener('click', submitTicket);
    };

    /**
     * Loads the required language strings.
     *
     * @returns {Promise}
     */
    const loadStrings = function() {
        const requests = STRING_KEYS.map(function(key) {
            return {key: key, component: 'local_freshdesk'};
        });
        return Str.get_strings(requests).then(function(values) {
            STRING_KEYS.forEach(function(key, idx) {
                strs[key] = values[idx];
            });
            return strs;
        });
    };

    /**
     * Renders the help button.
     *
     * @returns {Promise}
     */
    const renderHelpButton = function() {
        return Templates.render('local_freshdesk/help_button', {
            label: strs.gethelp,
            arialabel: strs.openwidget
        }).then(function(html) {
            const wrap = document.createElement('div');
            wrap.innerHTML = html.trim();
            const btn = wrap.firstChild;
            document.body.appendChild(btn);
            return btn;
        });
    };

    /**
     * Renders the passthrough button for guests.
     *
     * @returns {Promise}
     */
    const renderPassthroughButton = function() {
        return Templates.render('local_freshdesk/help_button', {
            label: strs.gethelp,
            arialabel: strs.openportal,
            href: cfg.portalUrl + '/support/home'
        }).then(function(html) {
            const wrap = document.createElement('div');
            wrap.innerHTML = html.trim();
            const link = wrap.firstChild;
            document.body.appendChild(link);
            return link;
        });
    };

    /**
     * Renders the main modal.
     *
     * @returns {Promise}
     */
    const renderModal = function() {
        return Templates.render('local_freshdesk/modal', {
            userName: cfg.userName || '',
            str: {
                title: strs.modaltitle,
                close: strs.close,
                searchplaceholder: strs.searchplaceholder,
                searchbutton: strs.searchbutton,
                initialprompt: strs.initialprompt,
                backtoresults: strs.backtoresults,
                openfullarticle: strs.openfullarticle,
                back: strs.back,
                ticketsubmitted: strs.ticketsubmitted,
                ticketreply: strs.ticketreply,
                subjectlabel: strs.subjectlabel,
                messagelabel: strs.messagelabel,
                messageplaceholder: strs.messageplaceholder,
                attachscreenshot: strs.attachscreenshot,
                removescreenshot: strs.removescreenshot,
                screenshothint: strs.screenshothint,
                privacynotice: strs.privacynotice,
                send: strs.send,
                relatedheading: strs.relatedheading,
                contactsupport: strs.contactsupport
            }
        }).then(function(html) {
            const wrap = document.createElement('div');
            wrap.innerHTML = html.trim();
            const overlay = wrap.firstChild;
            document.body.appendChild(overlay);
            return overlay;
        });
    };

    return {
        /**
         * Initialise the widget.
         */
        init: function() {
            cfg = window.local_freshdesk_config || {};

            if (!cfg.portalUrl) {
                return Promise.resolve();
            }

            injectStyles();

            return loadStrings().then(function() {
                if (!cfg.hasCapability) {
                    return renderPassthroughButton();
                }

                return Promise.all([renderModal(), renderHelpButton()])
                    .then(function(resultsArray) {
                        wireEvents(resultsArray[0]);
                        return resultsArray;
                    });
            });
        }
    };
});