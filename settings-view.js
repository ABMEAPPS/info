// ───────────────────────────────────────────────────────
// Copyright 2026 by Alan H. Jordan | All Rights Reserved
// Digital and Otherwise | ahjordan@max-opp.com
// ───────────────────────────────────────────────────────
// Athena — Settings View
// Version: 0.3.1.1

window.SettingsView = function SettingsView() {
  var t = window.getTheme();
  var [error, setError] = React.useState(null);
  var [backupDone, setBackupDone] = React.useState(false);
  var [confirmClear, setConfirmClear] = React.useState(false);

  // ── 5-tap admin trigger (mirrors V-Diary pattern) ──
  var tapCountRef = React.useRef(0);
  var tapTimerRef = React.useRef(null);
  var [adminMode, setAdminMode] = React.useState(false);
  var [showPasswordInput, setShowPasswordInput] = React.useState(false);
  var [passwordVal, setPasswordVal] = React.useState('');
  var [pwShow, setPwShow] = React.useState(false);
  var passwordInputRef = React.useRef(null);

  // ── Admin: Interview Config editor state ──
  var [interviewConfig, setInterviewConfig] = React.useState(null);
  var [configLoaded, setConfigLoaded] = React.useState(false);
  var [configDirty, setConfigDirty] = React.useState(false);
  var [configSaving, setConfigSaving] = React.useState(false);
  var [expandedScreen, setExpandedScreen] = React.useState(null);
  var [expandedT2, setExpandedT2] = React.useState(null);

  // Load interview config when admin mode activates
  React.useEffect(function() {
    if (!adminMode) return;
    window.loadInterviewConfig()
      .then(function(cfg) {
        try {
          setInterviewConfig(cfg || { screens: {} });
          setConfigLoaded(true);
        } catch (err) {
          console.error('[Settings] Interview config state update failed:', err);
          setConfigLoaded(true);
        }
      })
      .catch(function(err) {
        console.error('[Settings] Interview config load failed:', err);
        setInterviewConfig({ screens: {} });
        setConfigLoaded(true);
        window.showToast('Could not load interview configuration. Error: ' + (err.message || String(err)) + '. Starting with defaults. Email techsupport@max-opp.com if this keeps happening.', 'error');
      });
  }, [adminMode]);

  // Focus password input when shown
  React.useEffect(function() {
    if (showPasswordInput && passwordInputRef.current) {
      try { passwordInputRef.current.focus(); } catch (e) { /* no-op */ }
    }
  }, [showPasswordInput]);

  var handleVersionTap = function() {
    try {
      tapCountRef.current++;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (tapCountRef.current >= 5) {
        tapCountRef.current = 0;
        if (adminMode) {
          setAdminMode(false);
          setConfigDirty(false);
          window.showToast('Admin session ended.', 'info');
        } else {
          setShowPasswordInput(true);
          setPasswordVal('');
          setPwShow(false);
        }
        return;
      }
      tapTimerRef.current = setTimeout(function() { tapCountRef.current = 0; }, 2000);
    } catch (err) {
      console.error('[Settings] Version tap handler failed:', err);
      tapCountRef.current = 0;
    }
  };

  var handlePasswordSubmit = function() {
    try {
      window.checkAdminPassword(passwordVal)
        .then(function(ok) {
          try {
            if (ok) {
              setAdminMode(true);
              setShowPasswordInput(false);
              setPasswordVal('');
              setPwShow(false);
              window.showToast('Admin mode activated.', 'success');
            } else {
              window.showToast('Invalid password.', 'error');
              setPasswordVal('');
            }
          } catch (err) {
            console.error('[Settings] Password result handling failed:', err);
            setPasswordVal('');
          }
        })
        .catch(function(err) {
          console.error('[Settings] Password check failed:', err);
          window.showToast('Password verification failed. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.', 'error');
          setPasswordVal('');
        });
    } catch (err) {
      console.error('[Settings] Password submit failed:', err);
      window.showToast('I had trouble verifying the password. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.', 'error');
    }
  };

  // ── Interview Config editing helpers ──
  var updateScreenOverride = function(screenId, field, value) {
    try {
      var cfg = JSON.parse(JSON.stringify(interviewConfig || { screens: {} }));
      if (!cfg.screens) cfg.screens = {};
      if (!cfg.screens[screenId]) cfg.screens[screenId] = {};
      if (value && value.trim()) {
        cfg.screens[screenId][field] = value;
      } else {
        delete cfg.screens[screenId][field];
        // Clean up empty screen entry
        if (Object.keys(cfg.screens[screenId]).length === 0) {
          delete cfg.screens[screenId];
        }
      }
      setInterviewConfig(cfg);
      setConfigDirty(true);
    } catch (err) {
      console.error('[Settings] Config field update failed:', err);
      window.showToast('I had trouble updating that field. Error: ' + (err.message || String(err)) + '. Please try again.', 'error');
    }
  };

  var getOverrideValue = function(screenId, field) {
    try {
      if (!interviewConfig || !interviewConfig.screens || !interviewConfig.screens[screenId]) return '';
      return interviewConfig.screens[screenId][field] || '';
    } catch (err) {
      return '';
    }
  };

  // ── Tier 2 config editing helpers ──
  var updateTier2Override = function(screenId, field, value) {
    try {
      var cfg = JSON.parse(JSON.stringify(interviewConfig || { screens: {} }));
      if (!cfg.tier2) cfg.tier2 = {};
      if (!cfg.tier2[screenId]) cfg.tier2[screenId] = {};
      if (value && value.trim()) {
        cfg.tier2[screenId][field] = value;
      } else {
        delete cfg.tier2[screenId][field];
        if (Object.keys(cfg.tier2[screenId]).length === 0) {
          delete cfg.tier2[screenId];
        }
      }
      setInterviewConfig(cfg);
      setConfigDirty(true);
    } catch (err) {
      console.error('[Settings] Tier 2 config field update failed:', err);
      window.showToast('I had trouble updating that field. Error: ' + (err.message || String(err)) + '. Please try again.', 'error');
    }
  };

  var getTier2OverrideValue = function(screenId, field) {
    try {
      if (!interviewConfig || !interviewConfig.tier2 || !interviewConfig.tier2[screenId]) return '';
      return interviewConfig.tier2[screenId][field] || '';
    } catch (err) {
      return '';
    }
  };

  var renderTier2ConfigField = function(screenId, field, label, defaultVal) {
    var override = getTier2OverrideValue(screenId, field);
    try {
      return React.createElement('div', { key: screenId + '-t2-' + field, style: { marginBottom: '0.75rem' } },
        React.createElement('label', {
          style: { display: 'block', fontSize: '0.85rem', color: t.accent, fontWeight: 600, marginBottom: '0.25rem' }
        }, label),
        React.createElement('div', {
          style: { fontSize: '0.8rem', color: t.textMuted, marginBottom: '0.25rem' }
        }, 'Default: ' + (defaultVal || '(none)')),
        React.createElement('textarea', {
          value: override,
          onChange: function(e) { updateTier2Override(screenId, field, e.target.value); },
          placeholder: 'Leave blank to use default. Use {situation} for the situation name.',
          rows: 2,
          style: {
            width: '100%', padding: '0.5rem 0.65rem', background: t.bgInput,
            color: t.text, border: '1px solid ' + t.accentBorder, borderRadius: 6,
            fontSize: '0.95rem', fontFamily: t.fontBody, lineHeight: 1.4,
            outline: 'none', resize: 'vertical',
          },
          onFocus: function(e) { try { e.target.style.borderColor = t.accent; } catch(x){} },
          onBlur: function(e) { try { e.target.style.borderColor = t.accentBorder; } catch(x){} },
        })
      );
    } catch (err) {
      console.error('[Settings] renderTier2ConfigField failed for ' + screenId + '.' + field + ':', err);
      return React.createElement('div', { key: screenId + '-t2-' + field, style: { color: t.error, fontSize: '0.9rem' } },
        'Could not display this field. Error: ' + (err.message || String(err)));
    }
  };

  var handleConfigSave = function() {
    try {
      setConfigSaving(true);
      window.saveInterviewConfig(interviewConfig)
        .then(function() {
          try {
            setConfigSaving(false);
            setConfigDirty(false);
            window.showToast('Interview configuration saved. Changes will take effect for new interviews.', 'success');
          } catch (err) {
            console.error('[Settings] Config save callback failed:', err);
            setConfigSaving(false);
          }
        })
        .catch(function(err) {
          console.error('[Settings] Config save failed:', err);
          setConfigSaving(false);
          window.showToast('Configuration save failed. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.', 'error');
        });
    } catch (err) {
      console.error('[Settings] Config save setup failed:', err);
      setConfigSaving(false);
      window.showToast('I had trouble saving the configuration. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.', 'error');
    }
  };

  var handleConfigReset = function() {
    try {
      if (!confirm('Reset all interview and drilldown text to factory defaults? This cannot be undone.')) return;
      setInterviewConfig({ screens: {}, tier2: {} });
      setConfigDirty(true);
    } catch (err) {
      console.error('[Settings] Config reset failed:', err);
      window.showToast('I had trouble resetting the configuration. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.', 'error');
    }
  };

  // ── Data management functions ──
  function handleExportAll() {
    try {
      Promise.all([
        window.dbGetAll(window.STORE_PROFILES),
        window.dbGetAll(window.STORE_INTERVIEW),
        window.dbGetAll(window.STORE_PSI),
        window.dbGetAll(window.STORE_CREDENTIALS),
        window.dbGetAll(window.STORE_SETTINGS),
      ]).then(function(results) {
        try {
          var backup = {
            exportedAt: new Date().toISOString(),
            version: window.ATHENA_VERSION,
            profiles: results[0] || [],
            interviews: results[1] || [],
            psi: results[2] || [],
            credentials: results[3] || [],
            settings: results[4] || [],
          };
          var json = JSON.stringify(backup, null, 2);
          var blob = new Blob([json], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'athena-backup-' + new Date().toISOString().slice(0, 10) + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setBackupDone(true);
          window.showToast('Backup exported successfully.', 'success');
        } catch (err) {
          setError('Backup file creation failed: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.');
        }
      }).catch(function(err) {
        setError('Backup failed: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.');
      });
    } catch (err) {
      setError('Backup failed: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.');
    }
  }

  function handleClearAll() {
    try {
      var dbName = window.DB_NAME || 'AthenaDB';
      indexedDB.deleteDatabase(dbName);
      window.showToast('All data cleared. The app will reload.', 'info');
      setTimeout(function() { window.location.reload(); }, 2000);
    } catch (err) {
      setError('Clear failed: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.');
    }
  }

  // ── Helper: render a config text field ──
  var renderConfigField = function(screenId, field, label, defaultVal, isTextarea) {
    var override = getOverrideValue(screenId, field);
    try {
      return React.createElement('div', { key: screenId + '-' + field, style: { marginBottom: '0.75rem' } },
        React.createElement('label', {
          style: { display: 'block', fontSize: '0.85rem', color: t.accent, fontWeight: 600, marginBottom: '0.25rem' }
        }, label),
        React.createElement('div', {
          style: { fontSize: '0.8rem', color: t.textMuted, marginBottom: '0.25rem' }
        }, 'Default: ' + (defaultVal || '(none)')),
        isTextarea
          ? React.createElement('textarea', {
              value: override,
              onChange: function(e) { updateScreenOverride(screenId, field, e.target.value); },
              placeholder: 'Leave blank to use default',
              rows: 2,
              style: {
                width: '100%', padding: '0.5rem 0.65rem', background: t.bgInput,
                color: t.text, border: '1px solid ' + t.accentBorder, borderRadius: 6,
                fontSize: '0.95rem', fontFamily: t.fontBody, lineHeight: 1.4,
                outline: 'none', resize: 'vertical',
              },
              onFocus: function(e) { try { e.target.style.borderColor = t.accent; } catch(x){} },
              onBlur: function(e) { try { e.target.style.borderColor = t.accentBorder; } catch(x){} },
            })
          : React.createElement('input', {
              type: 'text',
              value: override,
              onChange: function(e) { updateScreenOverride(screenId, field, e.target.value); },
              placeholder: 'Leave blank to use default',
              style: {
                width: '100%', padding: '0.5rem 0.65rem', background: t.bgInput,
                color: t.text, border: '1px solid ' + t.accentBorder, borderRadius: 6,
                fontSize: '0.95rem', fontFamily: t.fontBody, outline: 'none',
              },
              onFocus: function(e) { try { e.target.style.borderColor = t.accent; } catch(x){} },
              onBlur: function(e) { try { e.target.style.borderColor = t.accentBorder; } catch(x){} },
            })
      );
    } catch (err) {
      console.error('[Settings] renderConfigField failed for ' + screenId + '.' + field + ':', err);
      return React.createElement('div', { key: screenId + '-' + field, style: { color: t.error, fontSize: '0.9rem' } },
        'Could not display this field. Error: ' + (err.message || String(err)));
    }
  };

  // ── Render ──
  return React.createElement('div', {
    style: { flex: 1, padding: '1rem 1.25rem', paddingBottom: '5rem' }
  },
    // Header with tappable version
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
    },
      React.createElement(window.OwlHeader, { subtitle: 'Settings' }),
      React.createElement('span', {
        onClick: handleVersionTap,
        style: {
          fontSize: '0.85rem', color: adminMode ? t.accent : t.textMuted,
          fontFamily: 'monospace', cursor: 'default', userSelect: 'none',
          padding: '0.25rem 0.5rem', borderRadius: 4,
          background: adminMode ? 'rgba(201,168,76,0.15)' : 'transparent',
        }
      }, 'v' + (window.ATHENA_VERSION || '?'))
    ),

    error ? React.createElement(window.ErrorBanner, { error: error, onDismiss: function() { setError(null); } }) : null,

    // ═══ Password input (hidden until 5-tap) ═══
    showPasswordInput ? React.createElement(window.Card, { style: { marginTop: '1rem' } },
      React.createElement('div', { style: { fontWeight: 600, color: t.text, fontSize: '1.1rem', marginBottom: '0.5rem' } },
        '\uD83D\uDD10 Administrator Access'),
      React.createElement('div', { style: { display: 'flex', gap: '0.5rem', alignItems: 'center' } },
        React.createElement('input', {
          ref: passwordInputRef,
          type: pwShow ? 'text' : 'password',
          value: passwordVal,
          onChange: function(e) { setPasswordVal(e.target.value); },
          onKeyDown: function(e) {
            try { if (e.key === 'Enter') handlePasswordSubmit(); } catch(x){}
          },
          placeholder: 'Enter admin password',
          style: {
            flex: 1, padding: '0.65rem 0.85rem', background: t.bgInput,
            color: t.text, border: '1px solid ' + t.accentBorder, borderRadius: 6,
            fontSize: '1rem', fontFamily: t.fontBody, outline: 'none',
          },
          onFocus: function(e) { try { e.target.style.borderColor = t.accent; } catch(x){} },
          onBlur: function(e) { try { e.target.style.borderColor = t.accentBorder; } catch(x){} },
        }),
        React.createElement('button', {
          onClick: function() { setPwShow(!pwShow); },
          'aria-label': pwShow ? 'Hide password' : 'Show password',
          style: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }
        }, pwShow ? '\uD83D\uDE48' : '\uD83D\uDC41')
      ),
      React.createElement('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' } },
        React.createElement(window.Button, {
          label: 'Unlock',
          variant: 'primary',
          onClick: handlePasswordSubmit,
          style: { flex: 1 },
        }),
        React.createElement(window.Button, {
          label: 'Cancel',
          variant: 'ghost',
          onClick: function() { setShowPasswordInput(false); setPasswordVal(''); setPwShow(false); },
          style: { flex: 1 },
        })
      )
    ) : null,

    // ═══ Admin Mode: Interview Text Editor ═══
    adminMode ? React.createElement(window.Card, { style: { marginTop: '1rem', border: '1.5px solid ' + t.accent } },
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }
      },
        React.createElement('div', { style: { fontWeight: 600, color: t.accent, fontSize: '1.1rem' } },
          '\u2699\uFE0F Interview Text Editor'),
        React.createElement('div', {
          style: { fontSize: '0.8rem', color: t.success, fontWeight: 600 }
        }, '\uD83D\uDD13 Admin Mode')
      ),
      React.createElement('p', {
        style: { fontSize: '0.95rem', color: t.textSecondary, lineHeight: 1.5, marginBottom: '1rem' }
      }, 'Customize the interview questions, subtitles, placeholders, and hints. Leave any field blank to use the factory default. Changes take effect for new interviews.'),

      !configLoaded
        ? React.createElement('p', { style: { color: t.textMuted } }, 'Loading configuration\u2026')
        : React.createElement('div', null,
            // Render each interview screen as a collapsible section
            window.INTERVIEW_SCREENS
              .filter(function(scr) { return scr.type !== 'info' && scr.type !== 'review'; })
              .map(function(scr) {
                try {
                  var isExpanded = expandedScreen === scr.id;
                  var hasOverrides = interviewConfig && interviewConfig.screens && interviewConfig.screens[scr.id] &&
                    Object.keys(interviewConfig.screens[scr.id]).length > 0;
                  return React.createElement('div', {
                    key: scr.id,
                    style: {
                      border: '1px solid ' + (hasOverrides ? t.accent : t.border),
                      borderRadius: 8, marginBottom: '0.5rem', overflow: 'hidden',
                    }
                  },
                    // Header (tap to expand/collapse)
                    React.createElement('button', {
                      onClick: function() {
                        try { setExpandedScreen(isExpanded ? null : scr.id); } catch(x){}
                      },
                      style: {
                        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.65rem 0.85rem', background: isExpanded ? 'rgba(201,168,76,0.08)' : 'transparent',
                        border: 'none', color: t.text, cursor: 'pointer', fontFamily: t.fontBody,
                        fontSize: '1rem', textAlign: 'left',
                      }
                    },
                      React.createElement('span', null,
                        (hasOverrides ? '\u2713 ' : '') + (scr.title || scr.id)
                      ),
                      React.createElement('span', {
                        style: { color: t.textMuted, fontSize: '0.9rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }
                      }, '\u25B6')
                    ),
                    // Expanded fields
                    isExpanded ? React.createElement('div', {
                      style: { padding: '0.75rem 0.85rem', borderTop: '1px solid ' + t.border }
                    },
                      renderConfigField(scr.id, 'title', 'Title', scr.title, false),
                      renderConfigField(scr.id, 'subtitle', 'Subtitle', scr.subtitle, true),
                      renderConfigField(scr.id, 'placeholder', 'Placeholder', scr.placeholder, false),
                      scr.type === 'multiItem' ? renderConfigField(scr.id, 'hint', 'Hint banner text', scr.hint || '', true) : null,
                      scr.type === 'multiItem' ? renderConfigField(scr.id, 'addLabel', 'Add button label', scr.addLabel, false) : null,
                      scr.body !== undefined ? renderConfigField(scr.id, 'body', 'Body text', scr.body, true) : null
                    ) : null
                  );
                } catch (err) {
                  console.error('[Settings] Screen section render failed for ' + scr.id + ':', err);
                  return React.createElement('div', { key: scr.id, style: { color: t.error, padding: '0.5rem' } },
                    'Could not display settings for "' + scr.id + '". Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.');
                }
              }),

            // ── Tier 2 (Drilldown) Text Editor ──
            React.createElement('div', {
              style: { fontWeight: 600, color: t.accent, fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem' }
            }, 'Tier 2 \u2014 Situation Drilldown Questions'),
            React.createElement('p', {
              style: { fontSize: '0.9rem', color: t.textSecondary, lineHeight: 1.4, marginBottom: '0.75rem' }
            }, 'These questions appear when the SME drills into each situation. Use {situation} where the situation name should appear.'),

            (function() {
              try {
                var t2defaults = window.TIER2_TEXT_DEFAULTS || {};
                var t2screens = [
                  { id: 'advice', label: 'Most Important Advice', fields: ['title', 'subtitle', 'placeholder'] },
                  { id: 'worse', label: 'What Makes It Worse', fields: ['title', 'subtitle', 'placeholder'] },
                  { id: 'resources', label: 'Resources', fields: ['title', 'subtitle'] },
                  { id: 'escalation', label: 'Escalation / Contact', fields: ['title', 'subtitle', 'placeholder', 'severityLabel'] },
                  { id: 'more', label: 'Additional Advice', fields: ['title', 'subtitle', 'placeholder'] },
                ];
                return t2screens.map(function(scr) {
                  try {
                    var isExpanded = expandedT2 === scr.id;
                    var hasOverrides = interviewConfig && interviewConfig.tier2 && interviewConfig.tier2[scr.id] &&
                      Object.keys(interviewConfig.tier2[scr.id]).length > 0;
                    var defaults = t2defaults[scr.id] || {};
                    return React.createElement('div', {
                      key: 't2-' + scr.id,
                      style: {
                        border: '1px solid ' + (hasOverrides ? t.accent : t.border),
                        borderRadius: 8, marginBottom: '0.5rem', overflow: 'hidden',
                      }
                    },
                      React.createElement('button', {
                        onClick: function() {
                          try { setExpandedT2(isExpanded ? null : scr.id); } catch(x){}
                        },
                        style: {
                          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.65rem 0.85rem', background: isExpanded ? 'rgba(201,168,76,0.08)' : 'transparent',
                          border: 'none', color: t.text, cursor: 'pointer', fontFamily: t.fontBody,
                          fontSize: '1rem', textAlign: 'left',
                        }
                      },
                        React.createElement('span', null,
                          (hasOverrides ? '\u2713 ' : '') + 'T2: ' + scr.label),
                        React.createElement('span', {
                          style: { color: t.textMuted, fontSize: '0.9rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }
                        }, '\u25B6')
                      ),
                      isExpanded ? React.createElement('div', {
                        style: { padding: '0.75rem 0.85rem', borderTop: '1px solid ' + t.border }
                      },
                        scr.fields.map(function(field) {
                          var fieldLabel = field === 'severityLabel' ? 'Severity Question' :
                            field.charAt(0).toUpperCase() + field.slice(1);
                          return renderTier2ConfigField(scr.id, field, fieldLabel, defaults[field] || '');
                        })
                      ) : null
                    );
                  } catch (err) {
                    console.error('[Settings] T2 section render failed for ' + scr.id + ':', err);
                    return React.createElement('div', { key: 't2-' + scr.id, style: { color: t.error, padding: '0.5rem' } },
                      'Could not display T2 settings for "' + scr.id + '". Error: ' + (err.message || String(err)));
                  }
                });
              } catch (err) {
                console.error('[Settings] Tier 2 section render failed:', err);
                return React.createElement('div', { style: { color: t.error } },
                  'Could not display Tier 2 settings. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.');
              }
            })(),

            // Save / Reset buttons
            React.createElement('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '1rem' } },
              React.createElement(window.Button, {
                label: configSaving ? 'Saving\u2026' : (configDirty ? 'Save Changes' : 'Saved'),
                variant: 'primary',
                onClick: configDirty ? handleConfigSave : function() {},
                style: { flex: 2, opacity: configDirty ? 1 : 0.5 },
              }),
              React.createElement(window.Button, {
                label: 'Reset to Defaults',
                variant: 'ghost',
                onClick: handleConfigReset,
                style: { flex: 1, fontSize: '0.9rem' },
              })
            )
          )
    ) : null,

    // ═══ Backup / Export ═══
    React.createElement(window.Card, { style: { marginTop: '1.5rem' } },
      React.createElement('div', { style: { fontWeight: 600, color: t.text, fontSize: '1.1rem', marginBottom: '0.35rem' } },
        '\uD83D\uDCE5 Backup Data'),
      React.createElement('p', { style: { fontSize: '0.95rem', color: t.textSecondary, lineHeight: 1.5, marginBottom: '0.75rem' } },
        'Export all profiles, interviews, and PSI data to a JSON file you can save.'),
      React.createElement(window.Button, {
        label: 'Export All Data',
        onClick: handleExportAll,
        variant: 'ghost',
        style: { width: '100%' },
      })
    ),

    // ═══ Clear Data ═══
    React.createElement(window.Card, { style: { marginTop: '1rem', border: '1px solid ' + (t.danger || '#CF6679') } },
      React.createElement('div', { style: { fontWeight: 600, color: t.danger || '#CF6679', fontSize: '1.1rem', marginBottom: '0.35rem' } },
        '\u26A0\uFE0F Data Management'),
      React.createElement('p', { style: { fontSize: '0.95rem', color: t.textSecondary, lineHeight: 1.5, marginBottom: '0.75rem' } },
        'Clear all data from this device. You must export a backup first.'),
      !confirmClear
        ? React.createElement(window.Button, {
            label: 'Clear All Data\u2026',
            onClick: function() {
              try {
                if (!backupDone) {
                  setError('Please export a backup before clearing data. Use the "Export All Data" button above.');
                  return;
                }
                setConfirmClear(true);
              } catch (err) {
                setError('Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.');
              }
            },
            variant: 'ghost',
            style: { width: '100%', color: t.danger || '#CF6679', borderColor: t.danger || '#CF6679' },
          })
        : React.createElement('div', null,
            React.createElement('p', {
              style: { fontSize: '1rem', color: t.danger || '#CF6679', fontWeight: 600, marginBottom: '0.75rem' }
            }, 'Your data will be exported automatically before deleting. Are you sure?'),
            React.createElement('div', { style: { display: 'flex', gap: '0.75rem' } },
              React.createElement(window.Button, {
                label: 'Yes, Export & Clear',
                onClick: function() {
                  try {
                    handleExportAll();
                    setTimeout(handleClearAll, 1500);
                  } catch (err) {
                    setError('Clear operation failed: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.');
                  }
                },
                style: { flex: 1, background: t.danger || '#CF6679', color: '#FFFFFF', borderColor: t.danger || '#CF6679' },
              }),
              React.createElement(window.Button, {
                label: 'Cancel',
                variant: 'ghost',
                onClick: function() { setConfirmClear(false); },
                style: { flex: 1 },
              })
            )
          )
    ),

    // ═══ About ═══
    React.createElement(window.Card, { style: { marginTop: '1.5rem' } },
      React.createElement('div', { style: { fontWeight: 600, color: t.text, fontSize: '1.1rem', marginBottom: '0.5rem' } },
        'About Athena'),
      React.createElement('div', { style: { fontSize: '0.95rem', color: t.textSecondary, lineHeight: 1.6 } },
        'Version: ' + (window.ATHENA_VERSION || '?')),
      React.createElement('div', { style: { fontSize: '0.95rem', color: t.textSecondary, lineHeight: 1.6 } },
        'Support: techsupport@max-opp.com'),
      React.createElement('div', { style: { fontSize: '0.95rem', color: t.textSecondary, lineHeight: 1.6, marginTop: '0.5rem' } },
        window.ABOUT_PRIVACY_TEXT || '')
    ),

    React.createElement('p', {
      style: { textAlign: 'center', fontSize: '1rem', color: t.textMuted, marginTop: '2rem' }
    }, window.COPYRIGHT + ' | v' + window.ATHENA_VERSION)
  );
};

console.log('Athena settings-view.js v0.3.1.1 loaded');
