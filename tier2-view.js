// ───────────────────────────────────────────────────────
// Copyright 2026 by Alan H. Jordan | All Rights Reserved
// Digital and Otherwise | ahjordan@max-opp.com
// ───────────────────────────────────────────────────────
// Athena — Tier 2: Situation Drill-Downs
// For each Problem from Tier 1, extracts Solutions and Mappings
var useState = React.useState;
var useEffect = React.useEffect;

// ── Main Tier 2 View ────────────────────────────────────────
window.Tier2View = function Tier2View(props) {
  var theme = props.theme;
  var psiDraft = props.psiDraft;
  var onPsiUpdate = props.onPsiUpdate;
  var onComplete = props.onComplete;
  var onEditTier1 = props.onEditTier1;
  var resumeProblemId = props.resumeProblemId;
  var onResumed = props.onResumed;
  var t = theme;

  var [activeProblem, setActiveProblem] = useState(null);
  var [tier2Data, setTier2Data] = useState({});
  var [loaded, setLoaded] = useState(false);
  var [errorInfo, setErrorInfo] = useState(null);
  var [tier2Text, setTier2Text] = useState(window.TIER2_TEXT_DEFAULTS || {});

  // Load admin interview config for Tier 2 text overrides
  useEffect(function() {
    window.loadInterviewConfig()
      .then(function(cfg) {
        try {
          setTier2Text(window.getTier2Text(cfg));
        } catch (err) {
          console.warn('[Tier2View] Config merge failed, using defaults:', err);
        }
      })
      .catch(function(err) {
        console.warn('[Tier2View] Config load failed, using defaults:', err);
      });
  }, []);

  // Load saved Tier 2 progress
  useEffect(function() {
    window.loadData(window.TIER2_KEY, {}).then(function(data) {
      setTier2Data(data || {});
      setLoaded(true);
    }).catch(function(err) {
      console.error('[Athena] Tier 2 load failed:', err);
      setTier2Data({});
      setLoaded(true);
    });
  }, []);

  // Auto-open a specific problem if resumeProblemId is set (e.g. from Dashboard click)
  useEffect(function() {
    if (!loaded || !resumeProblemId || !psiDraft || !psiDraft.problems) return;
    var match = psiDraft.problems.find(function(p) { return p.id === resumeProblemId; });
    if (match) {
      setActiveProblem(match);
    }
    if (onResumed) onResumed();
  }, [loaded, resumeProblemId]);

  // Auto-open a specific problem if resumeProblemId is set
  useEffect(function() {
    if (loaded && resumeProblemId && psiDraft && psiDraft.problems) {
      var found = psiDraft.problems.find(function(p) { return p.id === resumeProblemId; });
      if (found) {
        setActiveProblem(found);
      }
      if (onResumed) onResumed();
    }
  }, [loaded, resumeProblemId]);

  function saveTier2(data) {
    setTier2Data(data);
    window.saveWithRetry(window.TIER2_KEY, data);
  }

  function handleDrilldownComplete(problemId, drilldown) {
    // Step 1: Save Tier 2 answers (critical — do this first)
    var saveOk = false;
    try {
      var updated = Object.assign({}, tier2Data);
      updated[problemId] = Object.assign({}, drilldown, { completed: true, completedAt: new Date().toISOString() });
      saveTier2(updated);
      saveOk = true;
    } catch (err) {
      console.error('[Athena] Tier 2 save failed:', err);
      setErrorInfo({
        title: 'I could not save your answers',
        error: err.message || String(err),
        saved: false,
        context: 'Saving Tier 2 answers for situation: ' + problemId
      });
    }

    // Step 2: Update PSI draft (non-critical — answers are already saved)
    if (saveOk) {
      try {
        var newPsi = buildTier2Psi(psiDraft, problemId, drilldown);
        onPsiUpdate(newPsi);
      } catch (err) {
        console.error('[Athena] PSI update failed (answers are saved):', err);
        setErrorInfo({
          title: 'Your answers were saved, but I had trouble updating the PSI index',
          error: err.message || String(err),
          saved: true,
          context: 'Updating PSI after completing situation: ' + problemId
        });
      }
    }

    // Step 3: Always navigate back to situation list so the user is never stuck
    setActiveProblem(null);
  }

  function handleDrilldownSave(problemId, drilldown) {
    try {
      var updated = Object.assign({}, tier2Data);
      updated[problemId] = Object.assign({}, drilldown, { completed: false });
      saveTier2(updated);
    } catch (err) {
      console.error('[Athena] Drilldown save failed:', err);
      setErrorInfo({
        title: 'I had trouble saving your progress',
        error: err.message || String(err),
        saved: false,
        context: 'Auto-saving Tier 2 progress for situation: ' + problemId
      });
    }
  }

  function getStatus(problemId) {
    var d = tier2Data[problemId];
    if (!d) return 'not-started';
    if (d.completed) return 'complete';
    return 'in-progress';
  }

  function allComplete() {
    if (!psiDraft || !psiDraft.problems) return false;
    return psiDraft.problems.every(function(p) { return getStatus(p.id) === 'complete'; });
  }

  if (!loaded) {
    return React.createElement('div', {
      style: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: t.textSecondary }
    }, 'Loading\u2026');
  }

  // ── Error screen (replaces toast for actionable errors) ────
  if (errorInfo) {
    var version = window.ATHENA_VERSION || 'unknown';
    var now = new Date().toISOString();
    var device = navigator.userAgent || 'unknown';
    var reportText =
      'Athena Error Report\n---\n' +
      'Error: ' + errorInfo.error + '\n' +
      'Context: ' + errorInfo.context + '\n' +
      'Data saved: ' + (errorInfo.saved ? 'Yes' : 'No') + '\n' +
      'Version: ' + version + '\n' +
      'Time: ' + now + '\n' +
      'Device: ' + device + '\n---\n' +
      'What I was doing: (please describe briefly)';
    var copied = false;

    return React.createElement('div', {
      style: { padding: '24px', maxWidth: '540px', margin: '0 auto' }
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' } },
        React.createElement('img', { src: 'Athena192x192.png', alt: '', style: { width: '32px', height: '32px', borderRadius: '8px' } }),
        React.createElement('h1', { style: { fontSize: '20px', fontWeight: '700', color: '#CF6679' } }, errorInfo.title)
      ),
      errorInfo.saved && React.createElement('p', {
        style: { fontSize: '14px', color: t.success, marginBottom: '12px', fontWeight: '600' }
      }, '\u2705 Your answers were saved successfully.'),
      !errorInfo.saved && React.createElement('p', {
        style: { fontSize: '14px', color: '#CF6679', marginBottom: '12px', fontWeight: '600' }
      }, 'Your answers may not have been saved. Please try again.'),
      React.createElement('div', {
        style: { background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid ' + t.border }
      },
        React.createElement('div', { style: { fontSize: '12px', color: t.textMuted, marginBottom: '4px', fontWeight: '600' } }, 'ERROR DETAILS'),
        React.createElement('div', { style: { fontSize: '13px', color: t.text, fontFamily: 'monospace', wordBreak: 'break-all' } }, errorInfo.error)
      ),
      React.createElement('div', {
        style: { background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid ' + t.border }
      },
        React.createElement('div', { style: { fontSize: '12px', color: t.textMuted, marginBottom: '4px', fontWeight: '600' } }, 'WHAT TO DO'),
        React.createElement('p', { style: { fontSize: '14px', color: t.textSecondary, lineHeight: '1.5', margin: '0 0 8px 0' } },
          'Copy the error report below and email it to:'),
        React.createElement('div', {
          style: { fontSize: '15px', color: t.accent, fontWeight: '700', marginBottom: '8px', userSelect: 'all' }
        }, 'techsupport@max-opp.com'),
        React.createElement('p', { style: { fontSize: '13px', color: t.textMuted, margin: 0 } },
          'Include a brief description of what you were doing when this happened.')
      ),
      React.createElement('textarea', {
        id: 'athena-tier2-error-report',
        readOnly: true,
        value: reportText,
        style: {
          width: '100%', height: '120px', fontSize: '12px', fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.03)', color: t.textSecondary, border: '1px solid ' + t.border,
          borderRadius: '8px', padding: '10px', resize: 'none', marginBottom: '12px'
        }
      }),
      React.createElement('div', { style: { display: 'flex', gap: '10px' } },
        React.createElement('button', {
          onClick: function() {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(reportText).then(function() {
                window.showToast('Copied to clipboard', 'success');
              });
            } else {
              var ta = document.getElementById('athena-tier2-error-report');
              if (ta) { ta.select(); document.execCommand('copy'); }
              window.showToast('Copied to clipboard', 'success');
            }
          },
          style: {
            flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid ' + t.accent,
            background: 'transparent', color: t.accent, fontSize: '15px', fontWeight: '600', cursor: 'pointer'
          }
        }, '\uD83D\uDCCB Copy Error Report'),
        React.createElement('button', {
          onClick: function() { setErrorInfo(null); },
          style: {
            flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
            background: t.accent, color: t.accentText || '#0D1024', fontSize: '15px', fontWeight: '600', cursor: 'pointer'
          }
        }, 'Continue')
      )
    );
  }

  // ── Drill-down active ──────────────────────────────────────
  if (activeProblem) {
    var saved = tier2Data[activeProblem.id] || {};
    return React.createElement(DrilldownView, {
      problem: activeProblem,
      savedData: saved,
      psiDraft: psiDraft,
      theme: t,
      tier2Text: tier2Text,
      onComplete: function(drilldown) { handleDrilldownComplete(activeProblem.id, drilldown); },
      onSave: function(drilldown) { handleDrilldownSave(activeProblem.id, drilldown); },
      onBack: function() { setActiveProblem(null); },
      onEditTier1: onEditTier1,
    });
  }

  // ── Situation Selector ─────────────────────────────────────
  var problems = psiDraft ? psiDraft.problems : [];
  var completedCount = problems.filter(function(p) { return getStatus(p.id) === 'complete'; }).length;

  return React.createElement('div', {
    style: { padding: '20px', maxWidth: '540px', margin: '0 auto', paddingBottom: '32px' }
  },
    // Header
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' } },
        React.createElement('img', { src: 'Athena192x192.png', alt: '', style: { width: '32px', height: '32px', borderRadius: '8px' } }),
        React.createElement('h1', { style: { fontSize: '20px', fontWeight: '700', color: t.accent } }, 'Tier 2: Initial Response')
      ),
      React.createElement('p', {
        style: { fontSize: '14px', color: t.textSecondary, lineHeight: '1.5' }
      }, 'Choose a situation to explore. Athena will ask what you\u2019d tell your people, ' +
         'what makes it worse, and when they should contact you.'),
      React.createElement('div', {
        style: { fontSize: '13px', color: t.gold, marginTop: '8px', fontWeight: '500' }
      }, completedCount + ' of ' + problems.length + ' situations explored')
    ),

    // Progress bar
    React.createElement('div', {
      style: { height: '4px', background: t.bgSecondary, borderRadius: '2px', marginBottom: '20px' }
    },
      React.createElement('div', {
        style: {
          height: '100%', borderRadius: '2px', transition: 'width 0.3s',
          background: allComplete() ? t.success : t.accent,
          width: (problems.length > 0 ? (completedCount / problems.length) * 100 : 0) + '%'
        }
      })
    ),

    // Situation cards
    problems.map(function(problem, idx) {
      var status = getStatus(problem.id);
      var statusIcon = status === 'complete' ? '\u2705' : status === 'in-progress' ? '\uD83D\uDD36' : '\u25CB';
      var statusLabel = status === 'complete' ? 'Explored' : status === 'in-progress' ? 'In progress' : 'Not started';
      var borderColor = status === 'complete' ? t.success : status === 'in-progress' ? t.warning : t.cardBorder;

      return React.createElement('div', {
        key: problem.id,
        onClick: function() { setActiveProblem(problem); },
        style: {
          padding: '16px', borderRadius: '12px', marginBottom: '10px',
          background: t.card, border: '2px solid ' + borderColor,
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: '0 1px 3px ' + t.shadow
        }
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', {
              style: { fontSize: '15px', fontWeight: '600', color: t.text, marginBottom: '4px' }
            }, (idx + 1) + '. ' + problem.label),
            problem.description && React.createElement('div', {
              style: { fontSize: '13px', color: t.textSecondary, lineHeight: '1.4' }
            }, problem.description.slice(0, 100) + (problem.description.length > 100 ? '\u2026' : ''))
          ),
          React.createElement('div', { style: { textAlign: 'right', marginLeft: '12px' } },
            React.createElement('div', { style: { fontSize: '20px' } }, statusIcon),
            React.createElement('div', { style: { fontSize: '11px', color: t.textSecondary, marginTop: '2px' } }, statusLabel)
          )
        )
      );
    }),

    // Edit Tier 1 answers button
    onEditTier1 && React.createElement('button', {
      onClick: function() {
        try {
          onEditTier1();
        } catch (err) {
          console.error('[Tier2] Edit tier1 failed:', err);
          window.showToast('I could not navigate back to edit. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.', 'error');
        }
      },
      style: {
        width: '100%', padding: '12px', borderRadius: '10px',
        border: '1.5px solid ' + t.accent, background: 'transparent',
        color: t.accent, fontSize: '14px', fontWeight: '600',
        cursor: 'pointer', marginTop: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }
    }, '\u270F\uFE0F Edit Interview Answers'),

    // Finish button (when all complete)
    allComplete() && React.createElement('button', {
      onClick: onComplete,
      style: {
        width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
        background: t.accent, color: t.accentText,
        fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '16px'
      }
    }, '\u2192 Review Complete PSI'),

    // Can also finish early
    !allComplete() && completedCount > 0 && React.createElement('button', {
      onClick: onComplete,
      style: {
        width: '100%', padding: '12px', borderRadius: '10px',
        border: '1px solid ' + t.cardBorder, background: 'transparent',
        color: t.textSecondary, fontSize: '14px', cursor: 'pointer', marginTop: '16px'
      }
    }, 'Finish with ' + completedCount + ' of ' + problems.length + ' explored')
  );
};

// ═════════════════════════════════════════════════════════════
// DRILLDOWN VIEW — questions for a single Problem
// ═════════════════════════════════════════════════════════════
function DrilldownView(props) {
  var problem = props.problem;
  var savedData = props.savedData;
  var psiDraft = props.psiDraft;
  var t = props.theme;
  var onComplete = props.onComplete;
  var onSave = props.onSave;
  var onBack = props.onBack;
  var onEditTier1 = props.onEditTier1;
  var tx = props.tier2Text || window.TIER2_TEXT_DEFAULTS || {};

  var [screen, setScreen] = useState(savedData.screen || 0);
  var [answers, setAnswers] = useState(savedData.answers || {});
  var [inputMode, setInputMode] = useState('type');

  function setAnswer(key, val) {
    var next = Object.assign({}, answers);
    next[key] = val;
    setAnswers(next);
    onSave({ screen: screen, answers: next });
  }

  function goNext() {
    var next = screen + 1;
    setScreen(next);
    onSave({ screen: next, answers: answers });
    window.scrollTo(0, 0);
  }

  function goBack() {
    if (screen <= 0) { onBack(); return; }
    setScreen(screen - 1);
    window.scrollTo(0, 0);
  }

  function finish() {
    onComplete({ screen: screen, answers: answers });
  }

  // Total screens: 0=advice, 1=worse, 2=resource, 3=escalation, 4=more, 5=review
  var totalScreens = 6;
  var progressPct = (screen / (totalScreens - 1)) * 100;

  // ── Progress + header ──────────────────────────────────────
  var screenLabels = ['Advice', 'Worse', 'Resources', 'Escalation', 'More', 'Review'];
  var header = React.createElement('div', { style: { marginBottom: '16px' } },
    // Step dots — clickable to navigate between screens
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '12px' }
    },
      screenLabels.map(function(label, i) {
        var isCurrent = i === screen;
        var isVisited = i <= screen;
        return React.createElement('button', {
          key: i,
          onClick: function() { setScreen(i); window.scrollTo(0, 0); },
          title: label,
          style: {
            width: isCurrent ? '24px' : '10px', height: '10px',
            borderRadius: '5px', border: 'none', cursor: 'pointer',
            background: isCurrent ? t.accent : isVisited ? t.accent + '80' : t.bgSecondary,
            transition: 'all 0.2s', padding: 0
          }
        });
      })
    ),
    // Tappable situation label — tap to go back and edit in Tier 1
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: '8px',
        background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
        cursor: onEditTier1 ? 'pointer' : 'default',
      },
      onClick: onEditTier1 ? function() {
        try {
          onEditTier1();
        } catch (err) {
          console.error('[Drilldown] Edit tier1 failed:', err);
          window.showToast('I could not navigate back to edit. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.', 'error');
        }
      } : undefined,
    },
      React.createElement('div', { style: { fontSize: '13px', color: t.textSecondary } },
        React.createElement('span', { style: { color: t.textMuted, marginRight: '4px' } }, 'Situation:'),
        React.createElement('span', { style: { color: t.text, fontWeight: '600' } }, (problem && problem.label) || 'Unknown')
      ),
      onEditTier1 ? React.createElement('span', {
        style: { fontSize: '12px', color: t.accent, fontWeight: '600' }
      }, '\u270F\uFE0F Edit') : null
    )
  );

  // Build situation phrase for contextual questions
  var sitLabel = (problem && problem.label) ? problem.label.replace(/\.\s*$/, '').toLowerCase() : 'this situation';

  var content;

  switch (screen) {
    // ── Screen 0: Most important advice ──────────────────────
    case 0:
      content = React.createElement('div', null,
        React.createElement('h2', { style: qTitleStyle(t) },
          window.fillSituation((tx.advice && tx.advice.title) || '', sitLabel)),
        React.createElement('p', { style: qSubStyle(t) },
          (tx.advice && tx.advice.subtitle) || ''),
        React.createElement(window.InputModeTabs, {
          modes: ['type', 'scan'], active: inputMode, onChange: setInputMode, theme: t
        }),
        inputMode === 'type' && React.createElement(window.TextInput, {
          value: answers.primaryAdvice || '',
          onChange: function(v) { setAnswer('primaryAdvice', v); },
          placeholder: (tx.advice && tx.advice.placeholder) || '',
          multiline: true, theme: t
        }),
        inputMode === 'scan' && React.createElement(window.ScanPanel, {
          theme: t,
          onScanComplete: function(text) {
            var existing = answers.primaryAdvice || '';
            setAnswer('primaryAdvice', existing ? existing + '\n\n' + text : text);
            setInputMode('type');
          }
        })
      );
      break;

    // ── Screen 1: What makes it worse ────────────────────────
    case 1:
      content = React.createElement('div', null,
        React.createElement('h2', { style: qTitleStyle(t) },
          window.fillSituation((tx.worse && tx.worse.title) || '', sitLabel)),
        React.createElement('p', { style: qSubStyle(t) },
          (tx.worse && tx.worse.subtitle) || ''),
        React.createElement(window.InputModeTabs, {
          modes: ['type', 'scan'], active: inputMode, onChange: setInputMode, theme: t
        }),
        inputMode === 'type' && React.createElement(window.TextInput, {
          value: answers.makesWorse || '',
          onChange: function(v) { setAnswer('makesWorse', v); },
          placeholder: (tx.worse && tx.worse.placeholder) || '',
          multiline: true, theme: t
        })
      );
      break;

    // ── Screen 2: Resources ──────────────────────────────────
    case 2:
      var resources = answers.resources || [];

      content = React.createElement('div', null,
        React.createElement('h2', { style: qTitleStyle(t) },
          window.fillSituation((tx.resources && tx.resources.title) || '', sitLabel)),
        React.createElement('p', { style: qSubStyle(t) },
          (tx.resources && tx.resources.subtitle) || ''),

        // Existing resources
        resources.map(function(res, i) {
          return React.createElement(window.Card, { key: i, theme: t },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '14px', fontWeight: '500', color: t.text } }, res.label || res.uri),
                React.createElement('div', { style: { fontSize: '12px', color: t.textSecondary } }, res.type)
              ),
              React.createElement('button', {
                onClick: function() {
                  setAnswer('resources', resources.filter(function(_, idx) { return idx !== i; }));
                },
                style: { background: 'none', border: 'none', color: t.danger, fontSize: '16px', cursor: 'pointer' }
              }, '\u2715')
            )
          );
        }),

        // Add resource
        React.createElement(ResourceAdder, {
          theme: t,
          onAdd: function(res) {
            setAnswer('resources', resources.concat([res]));
          }
        })
      );
      break;

    // ── Screen 3: Escalation ─────────────────────────────────
    case 3:
      content = React.createElement('div', null,
        React.createElement('h2', { style: qTitleStyle(t) },
          window.fillSituation((tx.escalation && tx.escalation.title) || '', sitLabel)),
        React.createElement('p', { style: qSubStyle(t) },
          (tx.escalation && tx.escalation.subtitle) || ''),
        React.createElement(window.InputModeTabs, {
          modes: ['type', 'scan'], active: inputMode, onChange: setInputMode, theme: t
        }),
        inputMode === 'type' && React.createElement(window.TextInput, {
          value: answers.escalationWhen || '',
          onChange: function(v) { setAnswer('escalationWhen', v); },
          placeholder: (tx.escalation && tx.escalation.placeholder) || '',
          multiline: true, theme: t
        }),

        // Severity for this situation
        React.createElement('div', { style: { marginTop: '20px' } },
          React.createElement('div', {
            style: { fontSize: '14px', fontWeight: '600', color: t.text, marginBottom: '8px' }
          }, (tx.escalation && tx.escalation.severityLabel) || 'How serious is this situation typically?'),
          React.createElement(window.PillRow, {
            options: [
              { id: 'low', label: 'Low \u2014 minor inconvenience' },
              { id: 'moderate', label: 'Moderate \u2014 needs attention' },
              { id: 'high', label: 'High \u2014 act soon' },
              { id: 'critical', label: 'Critical \u2014 act now' }
            ],
            value: answers.severity || 'moderate',
            onChange: function(v) { setAnswer('severity', v); },
            theme: t
          })
        )
      );
      break;

    // ── Screen 4: Additional advice ──────────────────────────
    case 4:
      var additionalSolutions = answers.additionalSolutions || [];

      content = React.createElement('div', null,
        React.createElement('h2', { style: qTitleStyle(t) },
          window.fillSituation((tx.more && tx.more.title) || '', sitLabel)),
        React.createElement('p', { style: qSubStyle(t) },
          (tx.more && tx.more.subtitle) || ''),

        // Existing additional solutions
        additionalSolutions.map(function(sol, i) {
          return React.createElement(window.Card, { key: i, theme: t },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
              React.createElement('div', {
                style: { fontSize: '14px', color: t.text, lineHeight: '1.4', flex: 1 }
              }, sol.text),
              React.createElement('button', {
                onClick: function() {
                  setAnswer('additionalSolutions', additionalSolutions.filter(function(_, idx) { return idx !== i; }));
                },
                style: { background: 'none', border: 'none', color: t.danger, fontSize: '16px', cursor: 'pointer', marginLeft: '8px' }
              }, '\u2715')
            )
          );
        }),

        // Add more
        React.createElement(AdditionalSolutionAdder, {
          theme: t,
          onAdd: function(text) {
            setAnswer('additionalSolutions', additionalSolutions.concat([{ text: text, source: inputMode }]));
          }
        })
      );
      break;

    // ── Screen 5: Review ─────────────────────────────────────
    case 5:
      var allSolutions = [];
      if (answers.primaryAdvice) {
        allSolutions.push({ text: answers.primaryAdvice, priority: 'Primary', idx: 0 });
      }
      (answers.additionalSolutions || []).forEach(function(sol, i) {
        allSolutions.push({ text: sol.text, priority: 'Additional #' + (i + 1), idx: i + 1 });
      });

      // Edit button helper — jumps to a specific drilldown screen
      var editBtn = function(targetScreen, label) {
        return React.createElement('button', {
          onClick: function() { setScreen(targetScreen); window.scrollTo(0, 0); },
          style: {
            background: 'none', border: '1px solid ' + t.accent, borderRadius: '6px',
            color: t.accent, fontSize: '11px', fontWeight: '600', padding: '3px 10px',
            cursor: 'pointer', marginLeft: '8px', whiteSpace: 'nowrap'
          },
          title: 'Edit ' + label
        }, '\u270F\uFE0F Edit');
      };

      // Section header helper
      var sectionHead = function(label, count, targetScreen) {
        return React.createElement('div', {
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '8px' }
        },
          React.createElement('div', {
            style: { fontSize: '12px', color: t.accent, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }
          }, label + (count !== undefined ? ' (' + count + ')' : '')),
          editBtn(targetScreen, label)
        );
      };

      content = React.createElement('div', null,
        React.createElement('h2', { style: qTitleStyle(t) }, 'Review: ' + problem.label),
        React.createElement('p', { style: qSubStyle(t) }, 'Tap \u270F\uFE0F Edit on any section to revise it.'),

        // Solutions
        sectionHead('Solutions', allSolutions.length, 0),
        allSolutions.map(function(sol) {
          return React.createElement(window.Card, { key: sol.idx, theme: t },
            React.createElement('div', { style: { fontSize: '11px', color: t.gold, fontWeight: '600', marginBottom: '4px' } }, sol.priority),
            React.createElement('div', { style: { fontSize: '14px', color: t.text, lineHeight: '1.4' } }, sol.text)
          );
        }),

        // What makes it worse
        answers.makesWorse && React.createElement('div', null,
          sectionHead('What makes it worse', undefined, 1),
          React.createElement(window.Card, { theme: t },
            React.createElement('div', { style: { fontSize: '14px', color: t.text, lineHeight: '1.4' } }, answers.makesWorse)
          )
        ),

        // Resources
        (answers.resources || []).length > 0 && React.createElement('div', null,
          sectionHead('Resources', (answers.resources || []).length, 2),
          (answers.resources || []).map(function(res, i) {
            return React.createElement(window.Card, { key: i, theme: t },
              React.createElement('div', { style: { fontSize: '14px', color: t.text } }, res.label || res.uri),
              React.createElement('div', { style: { fontSize: '12px', color: t.textSecondary } }, res.type)
            );
          })
        ),

        // Escalation
        answers.escalationWhen && React.createElement('div', null,
          sectionHead('Contact provider when', undefined, 3),
          React.createElement(window.Card, { theme: t },
            React.createElement('div', { style: { fontSize: '14px', color: t.text, lineHeight: '1.4' } }, answers.escalationWhen)
          )
        ),

        // Additional solutions edit access
        sectionHead('Additional advice', (answers.additionalSolutions || []).length, 4),

        // Severity
        React.createElement('div', {
          style: { fontSize: '13px', color: t.textSecondary, marginTop: '12px' }
        }, 'Default severity: ' + (answers.severity || 'moderate'))
      );
      break;
  }

  // ── Navigation ─────────────────────────────────────────────
  var isReview = screen === 5;
  var canGo = screen === 0 ? !!(answers.primaryAdvice && answers.primaryAdvice.trim()) : true;

  var nav = React.createElement('div', {
    style: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 0', marginTop: '12px', borderTop: '1px solid ' + t.cardBorder
    }
  },
    React.createElement('button', {
      onClick: goBack,
      style: { background: 'none', border: 'none', fontSize: '15px', color: t.textSecondary, cursor: 'pointer' }
    }, screen === 0 ? '\u2190 Back to list' : '\u2190 Back'),

    React.createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
      screen > 0 && screen < 5 && React.createElement('button', {
        onClick: goNext,
        style: { background: 'none', border: 'none', fontSize: '13px', color: t.textSecondary, cursor: 'pointer' }
      }, 'Skip'),

      isReview ? React.createElement('button', {
        onClick: finish,
        style: btnStyle(t)
      }, '\u2713 Looks Good')
      : React.createElement('button', {
        onClick: goNext,
        disabled: !canGo,
        style: Object.assign({}, btnStyle(t), { opacity: canGo ? 1 : 0.4, cursor: canGo ? 'pointer' : 'default' })
      }, 'Next \u2192')
    )
  );

  return React.createElement('div', {
    style: { padding: '16px 20px', maxWidth: '540px', margin: '0 auto', paddingBottom: '32px' }
  }, header, content, nav);
}

// ═════════════════════════════════════════════════════════════
// Resource Adder — add URL, or scan a document
// ═════════════════════════════════════════════════════════════
function ResourceAdder(props) {
  var t = props.theme;
  var onAdd = props.onAdd;
  var [mode, setMode] = useState('url');
  var [url, setUrl] = useState('');
  var [label, setLabel] = useState('');

  return React.createElement('div', {
    style: { marginTop: '12px', padding: '14px', borderRadius: '10px', border: '1px solid ' + t.cardBorder, background: t.card }
  },
    // Mode tabs
    React.createElement('div', {
      style: { display: 'flex', gap: '4px', marginBottom: '10px', background: t.bgSecondary, borderRadius: '8px', padding: '3px' }
    },
      ['url', 'scan'].map(function(m) {
        var icons = { url: '\uD83D\uDD17 Link', scan: '\uD83D\uDCF7 Scan Document' };
        return React.createElement('button', {
          key: m, onClick: function() { setMode(m); },
          style: {
            flex: 1, padding: '7px', border: 'none', borderRadius: '6px', fontSize: '13px',
            background: mode === m ? t.card : 'transparent',
            color: mode === m ? t.accent : t.textSecondary,
            fontWeight: mode === m ? '600' : '400', cursor: 'pointer'
          }
        }, icons[m]);
      })
    ),

    mode === 'url' && React.createElement('div', null,
      React.createElement('input', {
        value: url, onChange: function(e) { setUrl(e.target.value); },
        placeholder: 'https://\u2026',
        style: {
          width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px',
          border: '1px solid ' + t.inputBorder, background: t.input, color: t.inputText,
          marginBottom: '8px', boxSizing: 'border-box'
        }
      }),
      React.createElement('input', {
        value: label, onChange: function(e) { setLabel(e.target.value); },
        placeholder: 'Label (e.g., "Breathing exercise video")',
        style: {
          width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px',
          border: '1px solid ' + t.inputBorder, background: t.input, color: t.inputText,
          marginBottom: '8px', boxSizing: 'border-box'
        }
      }),
      React.createElement('button', {
        onClick: function() {
          if (url.trim()) {
            onAdd({ type: 'url', uri: url.trim(), label: label.trim() || url.trim() });
            setUrl(''); setLabel('');
          }
        },
        disabled: !url.trim(),
        style: {
          padding: '8px 20px', borderRadius: '8px', border: 'none',
          background: url.trim() ? t.accent : t.pillInactive,
          color: url.trim() ? t.accentText : t.textSecondary,
          fontSize: '14px', cursor: url.trim() ? 'pointer' : 'default'
        }
      }, '+ Add Link')
    ),

    mode === 'scan' && React.createElement(window.ScanPanel, {
      theme: t,
      onScanComplete: function(text, parsed) {
        onAdd({
          type: 'scanned-document',
          uri: null,
          label: (parsed && parsed.title) || 'Scanned document',
          content: text,
          _raw: parsed
        });
      }
    })
  );
}

// ═════════════════════════════════════════════════════════════
// Additional Solution Adder
// ═════════════════════════════════════════════════════════════
function AdditionalSolutionAdder(props) {
  var t = props.theme;
  var onAdd = props.onAdd;
  var [text, setText] = useState('');
  var [inputMode, setInputMode] = useState('type');

  return React.createElement('div', {
    style: { marginTop: '12px', padding: '14px', borderRadius: '10px', border: '1px solid ' + t.cardBorder, background: t.card }
  },
    React.createElement(window.InputModeTabs, {
      modes: ['type', 'scan'], active: inputMode, onChange: setInputMode, theme: t
    }),

    inputMode === 'type' && React.createElement('div', { style: { display: 'flex', gap: '8px' } },
      React.createElement('textarea', {
        value: text, onChange: function(e) { setText(e.target.value); },
        placeholder: 'Another piece of advice\u2026',
        style: {
          flex: 1, minHeight: '60px', borderRadius: '8px', fontSize: '14px', padding: '10px',
          border: '1px solid ' + t.inputBorder, background: t.input, color: t.inputText,
          fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
        }
      }),
      React.createElement('button', {
        onClick: function() { if (text.trim()) { onAdd(text.trim()); setText(''); } },
        disabled: !text.trim(),
        style: {
          padding: '10px 16px', borderRadius: '8px', border: 'none', alignSelf: 'flex-end',
          background: text.trim() ? t.accent : t.pillInactive,
          color: text.trim() ? t.accentText : t.textSecondary,
          fontSize: '13px', fontWeight: '600', cursor: text.trim() ? 'pointer' : 'default'
        }
      }, '+ Add')
    ),

    inputMode === 'scan' && React.createElement(window.ScanPanel, {
      theme: t,
      onScanComplete: function(text) {
        onAdd(text);
      }
    })
  );
}

// ═════════════════════════════════════════════════════════════
// Build PSI from Tier 2 drilldown answers
// ═════════════════════════════════════════════════════════════
function buildTier2Psi(psiDraft, problemId, drilldown) {
  // Validate inputs
  if (!psiDraft) throw new Error('buildTier2Psi: psiDraft is null');
  if (!problemId) throw new Error('buildTier2Psi: problemId is missing');
  if (!drilldown) throw new Error('buildTier2Psi: drilldown is null');

  var psi = JSON.parse(JSON.stringify(psiDraft)); // deep clone

  // Ensure arrays exist (defensive against corrupted data)
  psi.problems = psi.problems || [];
  psi.solutions = psi.solutions || [];
  psi.mappings = psi.mappings || [];
  psi.meta = psi.meta || {};

  var ans = drilldown.answers || {};
  var domainKey = (psi.domain || 'GENERAL').toUpperCase().replace(/\s+/g, '-').slice(0, 12);

  // Update the problem's severity and tags
  var problemIdx = psi.problems.findIndex(function(p) { return p.id === problemId; });
  if (problemIdx >= 0) {
    if (ans.severity) psi.problems[problemIdx].severity = ans.severity;
    if (ans.makesWorse) {
      psi.problems[problemIdx].tags = psi.problems[problemIdx].tags || [];
      psi.problems[problemIdx].tags.push('avoid:' + ans.makesWorse.slice(0, 50));
    }
    if (ans.escalationWhen) {
      psi.problems[problemIdx].escalationFlag = true;
    }
    psi.problems[problemIdx]._tier = 2;
  }

  // Create solutions
  var existingSolCount = psi.solutions.length;
  var newSolutions = [];
  var newMappings = [];

  // Primary solution
  if (ans.primaryAdvice && ans.primaryAdvice.trim()) {
    var solSeq = String(existingSolCount + 1).padStart(3, '0');
    var primarySol = {
      id: 'S-' + domainKey + '-' + solSeq,
      label: ans.primaryAdvice.trim().slice(0, 60),
      guidance: ans.primaryAdvice.trim(),
      guidanceFormat: 'text',
      domain: psi.domain,
      category: 'self-care',
      effort: 'moderate',
      resources: (ans.resources || []).map(function(r) {
        return { type: r.type || 'url', uri: r.uri || '', label: r.label || '' };
      }),
      prerequisites: [],
      contraindications: [],
      providerOnly: false,
      active: true,
      _tier: 2
    };
    newSolutions.push(primarySol);
    newMappings.push({
      problemId: problemId,
      solutionId: primarySol.id,
      priority: 90,
      conditions: null,
      contextNote: 'Primary advice from SME',
      userFeedback: null
    });
  }

  // Additional solutions
  (ans.additionalSolutions || []).forEach(function(sol, i) {
    var solSeq = String(existingSolCount + newSolutions.length + 1).padStart(3, '0');
    var addSol = {
      id: 'S-' + domainKey + '-' + solSeq,
      label: sol.text.slice(0, 60),
      guidance: sol.text,
      guidanceFormat: 'text',
      domain: psi.domain,
      category: 'self-care',
      effort: 'moderate',
      resources: [],
      prerequisites: [],
      contraindications: [],
      providerOnly: false,
      active: true,
      _tier: 2
    };
    newSolutions.push(addSol);
    newMappings.push({
      problemId: problemId,
      solutionId: addSol.id,
      priority: Math.max(10, 80 - (i * 10)),
      conditions: null,
      contextNote: 'Additional advice #' + (i + 1),
      userFeedback: null
    });
  });

  // Escalation solution (providerOnly)
  if (ans.escalationWhen && ans.escalationWhen.trim()) {
    var escSeq = String(existingSolCount + newSolutions.length + 1).padStart(3, '0');
    var escSol = {
      id: 'S-' + domainKey + '-' + escSeq,
      label: 'Contact ' + ((psi.provider && psi.provider.name) || 'your provider'),
      guidance: ans.escalationWhen.trim(),
      guidanceFormat: 'text',
      domain: psi.domain,
      category: 'contact-provider',
      effort: 'moderate',
      resources: [],
      prerequisites: [],
      contraindications: [],
      providerOnly: true,
      active: true,
      _tier: 2
    };
    newSolutions.push(escSol);
    newMappings.push({
      problemId: problemId,
      solutionId: escSol.id,
      priority: 30,
      conditions: null,
      contextNote: 'Escalation: ' + ans.escalationWhen.trim().slice(0, 80),
      userFeedback: null
    });
  }

  psi.solutions = psi.solutions.concat(newSolutions);
  psi.mappings = psi.mappings.concat(newMappings);
  psi.meta.tier = 2;
  psi.meta.lastUpdated = new Date().toISOString();

  return psi;
}

// ── Style helpers ────────────────────────────────────────────
function qTitleStyle(t) {
  return { fontSize: '19px', fontWeight: '700', color: t.text, marginBottom: '8px', lineHeight: '1.3' };
}
function qSubStyle(t) {
  return { fontSize: '14px', color: t.textSecondary, marginBottom: '16px', lineHeight: '1.5' };
}
function btnStyle(t) {
  return {
    background: t.accent, color: t.accentText, border: 'none',
    borderRadius: '10px', padding: '12px 28px', fontSize: '16px',
    fontWeight: '600', cursor: 'pointer'
  };
}

console.log('Athena tier2-view.js loaded');
