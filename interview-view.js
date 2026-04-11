/**
 * Athena — The Configurator
 * interview-view.js — Interview stepper (Tier 1) + Grammar Scan
 * Version: 0.3.3.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

const { useState: useSt, useEffect: useEff, useCallback: useCb, useRef: useRf } = React;

// ─── Grammar Scan View (inline between review and PSI build) ────
window.GrammarScanView = function GrammarScanView({ answers, onComplete, onSkip }) {
  var t = window.getTheme();
  var [phase, setPhase] = useSt('scanning'); // scanning | reviewing
  var [suggestions, setSuggestions] = useSt([]);
  var [decisions, setDecisions] = useSt({}); // id → { action: 'accept'|'dismiss'|'modify'|'pending', text: '' }
  var [error, setError] = useSt(null);
  var [editingId, setEditingId] = useSt(null);
  var editRef = useRf(null);

  // On mount, call the grammar scan API
  useEff(function() {
    try {
      window.callGrammarScan(answers)
        .then(function(results) {
          try {
            if (!Array.isArray(results) || results.length === 0) {
              setPhase('reviewing');
              setSuggestions([]);
            } else {
              // Enrich suggestions with human-readable labels from screen titles
              var screenMap = {};
              (window.INTERVIEW_SCREENS || []).forEach(function(scr) {
                screenMap[scr.id] = scr.title;
              });
              results.forEach(function(s) {
                if (!s.label && screenMap[s.id]) {
                  s.label = screenMap[s.id];
                } else if (!s.label) {
                  // camelCase to spaced: whatYouDo → What You Do
                  s.label = s.id.replace(/([A-Z])/g, ' $1').replace(/^./, function(c) { return c.toUpperCase(); }).trim();
                }
              });
              setSuggestions(results);
              var init = {};
              results.forEach(function(s) {
                init[s.id] = { action: 'pending', text: s.corrected };
              });
              setDecisions(init);
              setPhase('reviewing');
            }
          } catch (err) {
            console.error('[GrammarScan] Processing results failed:', err);
            setError('I had trouble processing the grammar scan results. Error: ' + (err.message || String(err)) + '. You can skip the scan and continue. If this keeps happening, email techsupport@max-opp.com.');
            setPhase('reviewing');
            setSuggestions([]);
          }
        })
        .catch(function(err) {
          console.error('[GrammarScan] API call failed:', err);
          setError('The grammar scan could not reach the server. Error: ' + (err.message || String(err)) + '. You can skip the scan and continue. If this keeps happening, email techsupport@max-opp.com.');
          setPhase('reviewing');
          setSuggestions([]);
        });
    } catch (err) {
      console.error('[GrammarScan] Setup failed:', err);
      setError('I had trouble setting up the grammar scan. Error: ' + (err.message || String(err)) + '. You can skip the scan and continue.');
      setPhase('reviewing');
      setSuggestions([]);
    }
  }, []);

  // Focus edit input when editing starts
  useEff(function() {
    if (editingId && editRef.current) {
      try { editRef.current.focus(); } catch (e) { /* no-op */ }
    }
  }, [editingId]);

  var handleDecision = function(id, action) {
    try {
      var next = Object.assign({}, decisions);
      if (action === 'modify') {
        setEditingId(id);
        next[id] = Object.assign({}, next[id], { action: 'modify' });
      } else {
        next[id] = Object.assign({}, next[id], { action: action });
        setEditingId(null);
      }
      setDecisions(next);
    } catch (err) {
      console.error('[GrammarScan] Decision update failed:', err);
      window.showToast('I had trouble recording that choice. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.', 'error');
    }
  };

  var handleModifyText = function(id, text) {
    try {
      var next = Object.assign({}, decisions);
      next[id] = Object.assign({}, next[id], { text: text });
      setDecisions(next);
    } catch (err) {
      console.error('[GrammarScan] Text edit failed:', err);
      window.showToast('I had trouble saving your edit. Error: ' + (err.message || String(err)) + '. Please try again.', 'error');
    }
  };

  var handleModifyConfirm = function(id) {
    try {
      setEditingId(null);
    } catch (err) {
      console.error('[GrammarScan] Modify confirm failed:', err);
    }
  };

  var handleApplyAll = function() {
    try {
      var corrected = JSON.parse(JSON.stringify(answers));
      suggestions.forEach(function(sug) {
        try {
          var dec = decisions[sug.id];
          if (!dec || dec.action === 'dismiss' || dec.action === 'pending') return;
          var newText = dec.action === 'accept' ? sug.corrected : dec.text;
          if (!newText || !newText.trim()) return;

          // Parse the id to find the field and optional array index
          var parts = sug.id.split('_');
          var lastPart = parts[parts.length - 1];
          var isArrayIndex = /^\d+$/.test(lastPart) && parts.length > 1;

          if (isArrayIndex) {
            var fieldId = parts.slice(0, -1).join('_');
            var arrayIndex = parseInt(lastPart, 10);
            if (Array.isArray(corrected[fieldId]) && arrayIndex < corrected[fieldId].length) {
              corrected[fieldId][arrayIndex] = newText;
            }
          } else {
            corrected[sug.id] = newText;
          }
        } catch (itemErr) {
          console.error('[GrammarScan] Could not apply correction for ' + sug.id + ':', itemErr);
          // Skip this one but continue
        }
      });
      onComplete(corrected);
    } catch (err) {
      console.error('[GrammarScan] Apply corrections failed:', err);
      setError('I had trouble applying the corrections. Error: ' + (err.message || String(err)) + '. Your original answers are intact. You can skip the scan and continue, or email techsupport@max-opp.com.');
    }
  };

  var allDecided = suggestions.length === 0 || suggestions.every(function(s) {
    var d = decisions[s.id];
    return d && d.action !== 'pending';
  });
  var decidedCount = suggestions.filter(function(s) {
    var d = decisions[s.id];
    return d && d.action !== 'pending';
  }).length;

  // ─── Render: Scanning spinner ─────────────────────────────────
  if (phase === 'scanning') {
    return React.createElement('div', {
      style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem', paddingBottom: '5rem' }
    },
      React.createElement(window.OwlHeader, { subtitle: 'Checking your answers\u2026' }),
      React.createElement('div', {
        style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }
      },
        React.createElement('div', {
          style: {
            width: 48, height: 48, border: '3px solid ' + t.accentBorder,
            borderTop: '3px solid ' + t.accent, borderRadius: '50%',
            animation: 'athena-spin 1s linear infinite',
          }
        }),
        React.createElement('p', { style: { color: t.textSecondary, fontSize: '1.15rem', textAlign: 'center', lineHeight: 1.5 } },
          'I\u2019m scanning your responses for grammar, spelling, and clarity\u2026'),
        React.createElement('style', null, '@keyframes athena-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }')
      ),
      React.createElement('div', { style: { textAlign: 'center', marginTop: '1rem' } },
        React.createElement(window.Button, {
          label: 'Skip Grammar Scan',
          variant: 'ghost',
          onClick: function() { try { onSkip(); } catch(e) { console.error('[GrammarScan] Skip failed:', e); } },
        })
      )
    );
  }

  // ─── Render: Reviewing suggestions ────────────────────────────
  return React.createElement('div', {
    style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem', paddingBottom: '10rem' }
  },
    React.createElement(window.OwlHeader, { subtitle: 'Grammar & Spelling Review' }),

    error ? React.createElement(window.ErrorBanner, { error: error, onDismiss: function() { setError(null); } }) : null,

    suggestions.length === 0
      ? React.createElement('div', { style: { marginTop: '2rem', textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: '3rem', marginBottom: '0.75rem' } }, '\u2705'),
          React.createElement('h2', {
            style: { fontFamily: t.fontDisplay, color: t.text, fontSize: '1.6rem', marginBottom: '0.5rem' }
          }, 'Everything looks good!'),
          React.createElement('p', {
            style: { color: t.textSecondary, fontSize: '1.1rem', lineHeight: 1.5, marginBottom: '2rem' }
          }, 'No grammar or spelling issues found in your responses.'),
          React.createElement(window.Button, {
            label: 'Continue \u2192',
            variant: 'primary',
            onClick: function() {
              try { onComplete(answers); } catch(e) {
                console.error('[GrammarScan] Continue failed:', e);
                setError('Could not proceed. Error: ' + (e.message || String(e)) + '. Email techsupport@max-opp.com.');
              }
            },
            style: { width: '100%' },
          })
        )
      : React.createElement('div', { style: { marginTop: '1rem' } },
          React.createElement('p', {
            style: { color: t.textSecondary, fontSize: '1.05rem', lineHeight: 1.5, marginBottom: '1rem' }
          }, 'I found ' + suggestions.length + ' suggested ' + (suggestions.length === 1 ? 'correction' : 'corrections') + '. For each, you can accept the suggestion, modify it yourself, or dismiss it.'),

          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
            suggestions.map(function(sug) {
              try {
                var dec = decisions[sug.id] || { action: 'pending', text: sug.corrected };
                var isEditing = editingId === sug.id;
                var isAccepted = dec.action === 'accept';
                var isDismissed = dec.action === 'dismiss';
                var isModified = dec.action === 'modify' && !isEditing;

                var cardBorder = isAccepted ? t.success : isDismissed ? t.textMuted : isModified ? t.accent : t.accentBorder;
                var cardBg = isAccepted ? 'rgba(76,175,130,0.08)' : isDismissed ? 'rgba(107,109,128,0.08)' : isModified ? 'rgba(201,168,76,0.08)' : t.bgCard;

                return React.createElement(window.Card, {
                  key: sug.id,
                  style: { border: '1.5px solid ' + cardBorder, background: cardBg, transition: 'all 0.2s ease' }
                },
                  // Field label
                  React.createElement('div', {
                    style: { fontSize: '0.85rem', color: t.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }
                  }, sug.label || sug.id),

                  // Original text
                  React.createElement('div', { style: { marginBottom: '0.5rem' } },
                    React.createElement('span', { style: { fontSize: '0.85rem', color: t.textMuted } }, 'Original: '),
                    React.createElement('span', {
                      style: {
                        color: (isAccepted || isModified) ? t.textMuted : t.text,
                        fontSize: '1.05rem',
                        textDecoration: (isAccepted || isModified) ? 'line-through' : 'none',
                      }
                    }, sug.original)
                  ),

                  // Suggested correction
                  React.createElement('div', { style: { marginBottom: '0.35rem' } },
                    React.createElement('span', { style: { fontSize: '0.85rem', color: t.textMuted } }, 'Suggested: '),
                    React.createElement('span', {
                      style: { color: t.success, fontSize: '1.05rem', fontWeight: isAccepted ? 600 : 400 }
                    }, isModified ? dec.text : sug.corrected)
                  ),

                  // Reason
                  sug.reason ? React.createElement('div', {
                    style: { fontSize: '0.9rem', color: t.textMuted, fontStyle: 'italic', marginBottom: '0.5rem' }
                  }, sug.reason) : null,

                  // Status badge
                  (isAccepted || isDismissed || isModified) && !isEditing
                    ? React.createElement('div', {
                        style: {
                          display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 12,
                          fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem',
                          background: isAccepted ? t.success : isModified ? t.accent : t.textMuted,
                          color: '#FFFFFF',
                        }
                      }, isAccepted ? '\u2713 Accepted' : isModified ? '\u270F Modified' : '\u2715 Dismissed')
                    : null,

                  // Edit mode
                  isEditing
                    ? React.createElement('div', { style: { marginTop: '0.5rem', marginBottom: '0.5rem' } },
                        React.createElement('textarea', {
                          ref: editRef,
                          value: dec.text || '',
                          onChange: function(e) { handleModifyText(sug.id, e.target.value); },
                          rows: 3,
                          style: {
                            width: '100%', padding: '0.75rem', background: t.bgInput,
                            color: t.text, border: '1.5px solid ' + t.accent,
                            borderRadius: 8, fontSize: '1.05rem', fontFamily: t.fontBody,
                            lineHeight: 1.5, outline: 'none', resize: 'vertical',
                          },
                          onFocus: function(e) { try { e.target.style.borderColor = t.accent; } catch(x){} },
                          onBlur: function(e) { try { e.target.style.borderColor = t.accentBorder; } catch(x){} },
                        }),
                        React.createElement('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' } },
                          React.createElement(window.Button, {
                            label: '\u2713 Save Edit',
                            variant: 'primary',
                            onClick: function() { handleModifyConfirm(sug.id); },
                            style: { flex: 1, fontSize: '0.9rem', padding: '0.5rem' },
                          }),
                          React.createElement(window.Button, {
                            label: 'Cancel',
                            variant: 'ghost',
                            onClick: function() {
                              try { handleDecision(sug.id, 'pending'); setEditingId(null); } catch(x){}
                            },
                            style: { flex: 1, fontSize: '0.9rem', padding: '0.5rem' },
                          })
                        )
                      )
                    : null,

                  // Action buttons (always visible when not editing, for changing decisions)
                  !isEditing
                    ? React.createElement('div', {
                        style: { display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }
                      },
                        React.createElement('button', {
                          onClick: function() { handleDecision(sug.id, 'accept'); },
                          style: {
                            flex: 1, minWidth: '5rem', padding: '0.45rem 0.5rem', borderRadius: 6,
                            border: isAccepted ? 'none' : '1px solid ' + t.success,
                            background: isAccepted ? t.success : 'transparent',
                            color: isAccepted ? '#FFF' : t.success,
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: t.fontBody,
                          }
                        }, '\u2713 Accept'),
                        React.createElement('button', {
                          onClick: function() { handleDecision(sug.id, 'modify'); },
                          style: {
                            flex: 1, minWidth: '5rem', padding: '0.45rem 0.5rem', borderRadius: 6,
                            border: isModified ? 'none' : '1px solid ' + t.accent,
                            background: isModified ? t.accent : 'transparent',
                            color: isModified ? '#FFF' : t.accent,
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: t.fontBody,
                          }
                        }, '\u270F Modify'),
                        React.createElement('button', {
                          onClick: function() { handleDecision(sug.id, 'dismiss'); },
                          style: {
                            flex: 1, minWidth: '5rem', padding: '0.45rem 0.5rem', borderRadius: 6,
                            border: isDismissed ? 'none' : '1px solid ' + t.textMuted,
                            background: isDismissed ? t.textMuted : 'transparent',
                            color: isDismissed ? '#FFF' : t.textMuted,
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: t.fontBody,
                          }
                        }, '\u2715 Dismiss')
                      )
                    : null
                );
              } catch (cardErr) {
                console.error('[GrammarScan] Card render failed for ' + sug.id + ':', cardErr);
                return React.createElement(window.Card, { key: sug.id },
                  React.createElement('div', { style: { color: t.error } },
                    'Could not display this suggestion. Error: ' + (cardErr.message || String(cardErr)) + '. Email techsupport@max-opp.com.')
                );
              }
            })
          ),

          // Apply / Skip buttons — sticky bottom bar
          React.createElement('div', {
            style: {
              position: 'fixed',
              bottom: '60px',
              left: 0,
              right: 0,
              background: t.bgCard,
              borderTop: '1px solid ' + t.border,
              padding: '0.75rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              zIndex: 100
            }
          },
            // Progress indicator
            React.createElement('div', {
              style: { textAlign: 'center', fontSize: '0.85rem', color: allDecided ? t.success : t.textMuted }
            }, decidedCount + ' of ' + suggestions.length + ' reviewed' + (allDecided ? ' \u2014 ready to apply' : '')),
            React.createElement('div', {
              style: { display: 'flex', gap: '0.75rem' }
            },
              React.createElement(window.Button, {
                label: allDecided ? '\u2705 Apply Changes & Continue' : 'Review all suggestions above',
                variant: 'primary',
                onClick: allDecided ? handleApplyAll : function() { window.showToast('Please accept, modify, or dismiss each suggestion before continuing.', 'info'); },
                style: { flex: 2, opacity: allDecided ? 1 : 0.5 },
              }),
              React.createElement(window.Button, {
                label: 'Skip All',
                variant: 'ghost',
                onClick: function() { try { onSkip(); } catch(e) { console.error('[GrammarScan] Skip failed:', e); } },
                style: { flex: 1 },
              })
            )
          )
        )
  );
};


// ─── Tier 1 Interview View ─────────────────────────────────────────
window.InterviewView = function InterviewView({ profileId, onComplete, onTier2Start }) {
  var [interviewConfig, setInterviewConfig] = useSt(null);
  var [configLoaded, setConfigLoaded] = useSt(false);
  var [scanPhase, setScanPhase] = useSt(null); // null = normal, 'scanning' = grammar scan active
  var [profileName, setProfileName] = useSt('');

  // Load profile name
  useEff(function() {
    if (!profileId) return;
    window.dbGet(window.STORE_PROFILES, profileId)
      .then(function(p) {
        try { if (p && p.name) setProfileName(p.name); } catch(e) {}
      })
      .catch(function(err) {
        console.warn('[Interview] Profile name load failed:', err);
      });
  }, [profileId]);

  // Load admin interview config overrides
  useEff(function() {
    window.loadInterviewConfig()
      .then(function(cfg) {
        try { setInterviewConfig(cfg); } catch (err) { console.error('[Interview] Config state update failed:', err); }
        setConfigLoaded(true);
      })
      .catch(function(err) {
        console.warn('[Interview] Config load failed, using defaults:', err);
        setConfigLoaded(true);
      });
  }, []);

  var screens = configLoaded ? window.getInterviewScreens(interviewConfig) : window.INTERVIEW_SCREENS;

  var [step, setStep] = useSt(0);
  var [answers, setAnswers] = useSt({});
  var [inputMode, setInputMode] = useSt('type');
  var [error, setError] = useSt(null);
  var [saving, setSaving] = useSt(false);
  var [loaded, setLoaded] = useSt(false);
  var t = window.getTheme();

  // Load saved progress
  useEff(function() {
    if (!profileId) return;
    window.dbGet(window.STORE_INTERVIEW, profileId)
      .then(function(rec) {
        try {
          if (rec && rec.answers) {
            setAnswers(rec.answers);
            if (typeof rec.step === 'number') setStep(rec.step);
          }
          setLoaded(true);
        } catch (err) {
          console.error('[Interview] Processing saved progress failed:', err);
          setLoaded(true);
        }
      })
      .catch(function(err) {
        console.warn('[Interview] Load failed:', err);
        setLoaded(true);
      });
  }, [profileId]);

  var saveProgress = useCb(function(newAnswers, newStep) {
    if (!profileId) return;
    setSaving(true);
    window.dbPut(window.STORE_INTERVIEW, {
      profileId: profileId,
      answers: newAnswers,
      step: newStep,
      updatedAt: new Date().toISOString(),
    })
    .then(function() { setSaving(false); })
    .catch(function(err) {
      console.warn('[Interview] Save failed:', err);
      setSaving(false);
      window.showToast('I had trouble saving your progress. Your answers are still on screen. Error: ' + (err.message || String(err)) + '. If this keeps happening, email techsupport@max-opp.com.', 'warning');
    });
  }, [profileId]);

  var current = screens[step];
  if (!loaded || !configLoaded) {
    return React.createElement('div', {
      style: { padding: '2rem', textAlign: 'center', color: t.textMuted }
    }, 'Loading your progress\u2026');
  }
  if (!current) {
    return React.createElement('div', {
      style: { padding: '2rem', textAlign: 'center', color: t.error }
    }, "I can\u2019t find this interview screen. Please go back and try again, or restart the interview from your Profile. If this keeps happening, email techsupport@max-opp.com.");
  }

  // Build PSI and finish — called after grammar scan completes or is skipped
  // MUST be defined before the grammar-scan early return so it exists in that closure
  var finishInterview = function(finalAnswers) {
    try {
      var psi = window.buildTier1Psi(finalAnswers, profileId);
      window.dbPut(window.STORE_PSI, psi)
        .then(function() {
          return window.dbGet(window.STORE_PROFILES, profileId);
        })
        .then(function(profile) {
          if (profile) {
            profile.interviewComplete = true;
            profile.updatedAt = new Date().toISOString();
            return window.dbPut(window.STORE_PROFILES, profile);
          }
        })
        .then(function() {
          try {
            if (onComplete) onComplete(psi);
          } catch (err) {
            console.error('[Interview] onComplete callback failed:', err);
            setError('I finished building your PSI, but had trouble transitioning to the next step. Error: ' + (err.message || String(err)) + '. Try tapping the Dashboard tab, or email techsupport@max-opp.com.');
          }
        })
        .catch(function(err) {
          setError('I was not able to save your responses. Error: ' + (err.message || String(err)) + '. Please try again. If this keeps happening, email techsupport@max-opp.com.');
        });
    } catch (err) {
      setError('I had trouble organizing your responses. Error: ' + (err.message || String(err)) + '. Please review your answers and try again, or email techsupport@max-opp.com.');
    }
  };

  // If grammar scan is active, render GrammarScanView instead
  if (scanPhase === 'scanning') {
    return React.createElement(window.GrammarScanView, {
      answers: answers,
      onComplete: function(correctedAnswers) {
        try {
          setAnswers(correctedAnswers);
          saveProgress(correctedAnswers, step);
          setScanPhase(null);
          finishInterview(correctedAnswers);
        } catch (err) {
          console.error('[Interview] Applying grammar corrections failed:', err);
          setError('I had trouble applying the corrections. Error: ' + (err.message || String(err)) + '. Your original answers are intact. Email techsupport@max-opp.com if this keeps happening.');
          setScanPhase(null);
        }
      },
      onSkip: function() {
        try {
          setScanPhase(null);
          finishInterview(answers);
        } catch (err) {
          console.error('[Interview] Skip grammar scan failed:', err);
          setError('I had trouble proceeding after skipping the scan. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.');
          setScanPhase(null);
        }
      },
    });
  }

  var setAnswer = function(val) {
    try {
      var next = Object.assign({}, answers);
      next[current.id] = val;
      setAnswers(next);
      setError(null);
    } catch (err) {
      console.error('[Interview] Setting answer failed:', err);
      window.showToast('I had trouble recording that answer. Error: ' + (err.message || String(err)) + '. Please try again.', 'error');
    }
  };

  var validate = function() {
    try {
      if (!current.required) return true;
      var val = answers[current.id];
      if (current.type === 'multiItem') {
        if (!Array.isArray(val) || val.filter(function(s) { return s.trim(); }).length < (current.minItems || 1)) {
          setError('Please add at least ' + (current.minItems || 1) + ' situation before continuing.');
          return false;
        }
      } else if (current.type === 'text' || current.type === 'textarea') {
        if (!window.validateRequired(val)) {
          setError('This field needs a response before we can continue.');
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('[Interview] Validation failed:', err);
      setError('I had trouble checking this field. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.');
      return false;
    }
  };

  var goNext = function() {
    try {
      if (current.type !== 'info' && current.type !== 'review') {
        if (!validate()) return;
      }
      setError(null);
      var nextStep = step + 1;
      if (nextStep >= screens.length) {
        // Interview complete — launch grammar scan before building PSI
        setScanPhase('scanning');
        return;
      }
      setStep(nextStep);
      saveProgress(answers, nextStep);
    } catch (err) {
      console.error('[Interview] goNext failed:', err);
      setError('I had trouble moving to the next step. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.');
    }
  };

  var goBack = function() {
    try {
      if (step > 0) {
        setError(null);
        var prevStep = step - 1;
        setStep(prevStep);
        saveProgress(answers, prevStep);
      }
    } catch (err) {
      console.error('[Interview] goBack failed:', err);
      setError('I had trouble going back. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.');
    }
  };

  var handleScanText = function(text) {
    try {
      setAnswer((answers[current.id] || '') + text);
      setInputMode('type');
    } catch (err) {
      console.error('[Interview] Scan text insertion failed:', err);
      window.showToast('I had trouble inserting the scanned text. Error: ' + (err.message || String(err)) + '. Please try typing it manually.', 'error');
    }
  };

  // ─── Render current screen ───────────────────────────────────────
  var renderField = function() {
    try {
      if (current.type === 'info') return null;

      if (current.type === 'review') {
        return React.createElement(window.ReviewScreen, {
          answers: answers,
          screens: screens,
          onEditStep: function(idx) {
            try {
              if (idx < 0 || idx >= screens.length) {
                window.showToast('I could not find that interview step. Please use the Back button instead.', 'warning');
                return;
              }
              setStep(idx);
              saveProgress(answers, idx);
            } catch (err) {
              console.error('[Interview] Edit step navigation failed:', err);
              window.showToast('I had trouble navigating to that step. Error: ' + (err.message || String(err)) + '. Try using the Back button, or email techsupport@max-opp.com.', 'error');
            }
          },
        });
      }

      if (current.type === 'multiItem') {
        return React.createElement('div', null,
          React.createElement(window.InputModeTabs, { activeMode: inputMode, onModeChange: setInputMode }),
          inputMode === 'scan'
            ? React.createElement(window.ScanPanel, { onTextExtracted: function(txt) {
                try {
                  var list = Array.isArray(answers[current.id]) ? answers[current.id].slice() : [''];
                  var lastEmpty = list.findIndex(function(s) { return !s.trim(); });
                  if (lastEmpty >= 0) { list[lastEmpty] = txt; } else { list.push(txt); }
                  setAnswer(list);
                  setInputMode('type');
                } catch (err) {
                  console.error('[Interview] Scan insertion to multiItem failed:', err);
                  window.showToast('I had trouble adding the scanned text. Error: ' + (err.message || String(err)) + '. Please try typing it manually.', 'error');
                }
              }})
            : React.createElement(window.SituationBuilder, {
                items: answers[current.id],
                onChange: function(val) { setAnswer(val); },
                placeholder: current.placeholder,
                addLabel: current.addLabel,
                maxItems: current.maxItems,
                maxLength: current.maxLength,
                hint: current.hint,
              })
        );
      }

      // Text or Textarea
      var isTextarea = current.type === 'textarea';
      return React.createElement('div', null,
        React.createElement(window.InputModeTabs, { activeMode: inputMode, onModeChange: setInputMode }),
        inputMode === 'scan'
          ? React.createElement(window.ScanPanel, { onTextExtracted: handleScanText })
          : React.createElement('div', null,
              isTextarea
                ? React.createElement(window.TextAreaInput, {
                    value: answers[current.id] || '',
                    onChange: function(v) { setAnswer(v); },
                    placeholder: current.placeholder,
                    maxLength: current.maxLength,
                    rows: 5,
                  })
                : React.createElement(window.TextInput, {
                    value: answers[current.id] || '',
                    onChange: function(v) { setAnswer(v); },
                    placeholder: current.placeholder,
                    maxLength: current.maxLength,
                    autoFocus: true,
                  }),
              React.createElement(window.CharCounter, {
                value: answers[current.id] || '',
                maxLength: current.maxLength
              })
            )
      );
    } catch (err) {
      console.error('[Interview] renderField failed:', err);
      return React.createElement(window.ErrorBanner, {
        error: 'I had trouble displaying this field. Error: ' + (err.message || String(err)) + '. Try using the Back button or email techsupport@max-opp.com.',
        onDismiss: function() { setError(null); },
      });
    }
  };

  var isLast = step === screens.length - 1;

  return React.createElement('div', {
    style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem', paddingBottom: '5rem' }
  },
    React.createElement(window.OwlHeader, { subtitle: 'Interview \u2014 Step ' + (step + 1) + ' of ' + screens.length }),
    profileName ? React.createElement('div', {
      style: {
        fontSize: '0.9rem', color: t.textSecondary, marginTop: '0.15rem', marginBottom: '0.25rem',
        fontFamily: t.fontBody,
      }
    }, 'Profile: ' + profileName) : null,
    React.createElement(window.ProgressBar, { current: step + 1, total: screens.length }),
    React.createElement('div', { style: { marginTop: '1.5rem', flex: 1 } },
      React.createElement('h2', {
        style: {
          fontFamily: t.fontDisplay, fontSize: '1.85rem', fontWeight: 600,
          color: t.text, marginBottom: '0.35rem', lineHeight: 1.3,
        }
      }, current.title),
      current.subtitle ? React.createElement('p', {
        style: { color: t.textSecondary, fontSize: '1.15rem', marginBottom: '1.25rem', lineHeight: 1.5 }
      }, current.subtitle) : null,
      current.body ? React.createElement('p', {
        style: { color: t.textSecondary, fontSize: '1.2rem', marginBottom: '1.25rem', lineHeight: 1.6 }
      }, current.body) : null,
      error ? React.createElement(window.ErrorBanner, { error: error, onDismiss: function() { setError(null); } }) : null,
      renderField()
    ),
    React.createElement('div', {
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '1.5rem', gap: '1rem',
      }
    },
      step > 0
        ? React.createElement(window.Button, { label: '\u2190 Back', variant: 'ghost', onClick: goBack })
        : React.createElement('div'),
      React.createElement(window.Button, {
        label: isLast ? 'Finish & Review \u2192' : 'Next \u2192',
        variant: 'primary',
        onClick: goNext,
      })
    ),
    saving ? React.createElement('div', {
      style: { textAlign: 'center', fontSize: '1rem', color: t.textMuted, marginTop: '0.5rem' }
    }, 'Saving\u2026') : null
  );
};

// ─── Review Screen ─────────────────────────────────────────────────
var formatFieldLabel = function(field) {
  if (!field) return '';
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, function(c) { return c.toUpperCase(); })
    .trim();
};

window.ReviewScreen = function ReviewScreen({ answers, screens, onEditStep }) {
  var t = window.getTheme();
  var fields = screens.filter(function(s) { return s.psiField && s.type !== 'review'; });
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
    fields.map(function(scr) {
      try {
        var val = answers[scr.id];
        var display = '';
        if (Array.isArray(val)) {
          display = val.filter(function(s) { return s && s.trim(); }).map(function(s, i) { return (i + 1) + '. ' + s; }).join('\n');
        } else {
          display = val || '(not provided)';
        }
        var label = formatFieldLabel(scr.psiField);
        var stepIndex = screens.findIndex(function(s) { return s.id === scr.id; });
        return React.createElement(window.Card, { key: scr.id, style: { marginBottom: '0.25rem' } },
          React.createElement('div', {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }
          },
            React.createElement('div', {
              style: { fontSize: '1rem', color: t.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }
            }, label),
            onEditStep && stepIndex >= 0 ? React.createElement('button', {
              onClick: function() {
                try { onEditStep(stepIndex); } catch (err) {
                  console.error('[ReviewScreen] Edit navigation failed:', err);
                  window.showToast('I had trouble navigating to that step. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.', 'error');
                }
              },
              'aria-label': 'Edit ' + label,
              style: {
                background: 'none', border: '1px solid ' + t.accentBorder,
                borderRadius: 6, padding: '0.25rem 0.6rem',
                color: t.accent, fontSize: '0.9rem', cursor: 'pointer',
                fontFamily: t.fontBody,
              }
            }, '\u270F\uFE0F Edit') : null
          ),
          React.createElement('div', {
            style: { color: t.text, fontSize: '1.15rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }
          }, display)
        );
      } catch (err) {
        console.error('[ReviewScreen] Render card failed for ' + scr.id + ':', err);
        return React.createElement(window.Card, { key: scr.id },
          React.createElement('div', { style: { color: t.error } },
            'I had trouble displaying this field. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com.')
        );
      }
    })
  );
};

console.log('Athena interview-view.js v0.3.3.0 loaded');
