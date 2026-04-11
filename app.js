/**
 * Athena — The Configurator
 * app.js — Main application component
 * Version: 0.3.4.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

// ─── Error Boundary (class component) ──────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, copied: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }
  componentDidCatch(error, info) {
    console.error('[Athena ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      var self = this;
      var t;
      try { t = window.getTheme(); } catch(e) { t = null; }
      var bg = (t && t.bg) || '#0D1024';
      var text = (t && t.text) || '#E8E0D0';
      var accent = (t && t.accent) || '#C9A84C';
      var textSec = (t && t.textSecondary) || '#9A9BAF';
      var textMut = (t && t.textMuted) || '#6B6D80';
      var fontD = (t && t.fontDisplay) || "'Cormorant Garamond', serif";
      var fontB = (t && t.fontBody) || "'DM Sans', sans-serif";
      var border = (t && t.border) || '#2A2D4A';
      var errBg = 'rgba(255,255,255,0.05)';
      var errMsg = this.state.error ? String(this.state.error.message || this.state.error) : 'Unknown';
      var version = window.ATHENA_VERSION || 'unknown';
      var now = new Date().toISOString();
      var device = navigator.userAgent || 'unknown';

      var reportText =
        'Athena Error Report\n' +
        '---\n' +
        'Error: ' + errMsg + '\n' +
        'Version: ' + version + '\n' +
        'Time: ' + now + '\n' +
        'Device: ' + device + '\n' +
        '---\n' +
        'What I was doing: (please describe briefly)';

      var advice = '';
      if (errMsg.indexOf('undefined') > -1 && errMsg.indexOf('reading') > -1) {
        advice = 'This may be a code issue. Ask tech support to check for missing variables or broken references in the file mentioned above.';
      } else if (errMsg.indexOf("'") > -1 && (errMsg.indexOf('Unexpected') > -1 || errMsg.indexOf('missing') > -1)) {
        advice = 'Tell tech support to check the code for single-quote marks causing bad syntax.';
      } else if (errMsg.indexOf('#130') > -1 || errMsg.indexOf('Element type') > -1) {
        advice = 'A component failed to load. Ask tech support to check that all script files are loading correctly and in the right order.';
      }

      var handleCopy = function() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(reportText).then(function() {
            self.setState({ copied: true });
            setTimeout(function() { self.setState({ copied: false }); }, 3000);
          }).catch(function() {
            var ta = document.getElementById('athena-error-report');
            if (ta) { ta.select(); document.execCommand('copy'); }
            self.setState({ copied: true });
            setTimeout(function() { self.setState({ copied: false }); }, 3000);
          });
        }
      };

      var handleClearAndRestart = function() {
        if (confirm("This will clear all of Athena's local data and restart fresh. Your profiles and interview progress will be removed. Continue?")) {
          try { indexedDB.deleteDatabase(window.DB_NAME || 'AthenaDB'); } catch(e) {}
          if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(r) { r.unregister(); });
            }).catch(function() {});
          }
          if (window.caches) {
            caches.keys().then(function(names) {
              names.forEach(function(n) { caches.delete(n); });
            }).catch(function() {});
          }
          setTimeout(function() { window.location.reload(); }, 500);
        }
      };

      return React.createElement('div', {
        style: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          minHeight: '100dvh', padding: '1.5rem',
          textAlign: 'center', background: bg, color: text, fontFamily: fontB,
          overflowY: 'auto',
        }
      },
        React.createElement('div', { style: { maxWidth: '500px', width: '100%', marginTop: '2rem' } },
          React.createElement('img', {
            src: 'Athena192x192.png', alt: 'Athena',
            style: { width: 80, height: 80, borderRadius: '50%', marginBottom: '1.25rem' },
            onError: function(e) { e.target.style.display = 'none'; },
          }),
          React.createElement('h1', {
            style: { fontFamily: fontD, color: accent, fontSize: '2rem', marginBottom: '0.75rem' }
          }, "I've run into a problem"),
          React.createElement('p', {
            style: { color: textSec, fontSize: '1.15rem', marginBottom: '1.25rem', lineHeight: 1.5 }
          }, "I'm sorry about this. The error details are shown below. Please copy them and email them to our support team."),

          React.createElement('div', {
            style: {
              background: errBg, border: '1px solid ' + accent,
              borderRadius: 8, padding: '1rem', marginBottom: '1.25rem',
            }
          },
            React.createElement('div', {
              style: { fontSize: '1rem', color: textSec, marginBottom: '0.35rem' }
            }, 'Send error details to:'),
            React.createElement('div', {
              style: { fontSize: '1.3rem', color: accent, fontWeight: 600 }
            }, 'techsupport@max-opp.com')
          ),

          React.createElement('textarea', {
            id: 'athena-error-report',
            readOnly: true,
            value: reportText,
            style: {
              width: '100%', minHeight: '10rem', padding: '1rem',
              background: errBg, color: textMut,
              border: '1px solid ' + border, borderRadius: 8,
              fontSize: '0.95rem', fontFamily: 'monospace',
              lineHeight: 1.4, resize: 'vertical',
              marginBottom: '0.75rem',
            },
            onClick: function(e) { e.target.select(); },
          }),

          advice ? React.createElement('div', {
            style: {
              background: 'rgba(201,168,76,0.12)', border: '1px solid ' + accent,
              borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1rem',
              textAlign: 'left', fontSize: '1rem', color: accent, lineHeight: 1.4,
            }
          },
            React.createElement('strong', null, 'Tip: '),
            advice
          ) : null,

          React.createElement('button', {
            onClick: handleCopy,
            style: {
              display: 'block', width: '100%',
              background: accent, color: bg, border: 'none',
              borderRadius: 8, padding: '1rem 1.75rem', marginBottom: '1rem',
              fontSize: '1.15rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: fontB,
            }
          }, self.state.copied ? '✓ Copied to Clipboard' : 'Copy Error Details'),

          React.createElement('button', {
            onClick: handleClearAndRestart,
            style: {
              display: 'block', width: '100%',
              background: 'none', border: '1px solid ' + border, color: textSec,
              borderRadius: 8, padding: '0.85rem 1.5rem', marginTop: '0.5rem',
              fontSize: '1rem', cursor: 'pointer', fontFamily: fontB,
            }
          }, 'Clear Data & Restart Fresh'),
          React.createElement('p', {
            style: { fontSize: '0.9rem', color: textMut, marginTop: '0.5rem' }
          }, 'This removes all local data and may fix the issue, but your interview progress will be lost.')
        )
      );
    }
    return this.props.children;
  }
}

// ─── Main App ──────────────────────────────────────────────────────
function AthenaApp() {
  const t = window.getTheme();
  const [activeTab, setActiveTab] = React.useState('interview');
  const [profileId, setProfileId] = React.useState(null);
  const [interviewPhase, setInterviewPhase] = React.useState('tier1'); // tour | tier1 | tier2 | finalize | credentials | done
  const [tourSeen, setTourSeen] = React.useState(false);
  const [psi, setPsi] = React.useState(null);
  const [resumeProblemId, setResumeProblemId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [forceTour, setForceTour] = React.useState(false);
  const [isReupload, setIsReupload] = React.useState(false);

  // On mount: load active profile or show profile selector
  React.useEffect(function() {
    window.selfVerify();
    // Check if tour has been seen
    window.dbGet(window.STORE_SETTINGS, 'tourComplete').then(function(rec) {
      if (rec && rec.value) setTourSeen(true);
    }).catch(function() {});
    window.getActiveProfileId()
      .then(function(id) {
        if (id) {
          // Verify profile still exists
          return window.dbGet(window.STORE_PROFILES, id).then(function(p) {
            if (p) {
              setProfileId(id);
              // Determine phase
              if (p.interviewComplete) {
                return window.dbGet(window.STORE_PSI, id).then(function(psiData) {
                  if (psiData) setPsi(psiData);
                  if (p.credentialsComplete) {
                    setInterviewPhase('done');
                  } else {
                    // Check if PSI has solutions (Tier 2 done)
                    if (psiData && psiData.solutions && psiData.solutions.length > 0) {
                      setInterviewPhase('credentials');
                    } else {
                      setInterviewPhase('tier2');
                    }
                  }
                });
              }
            } else {
              setActiveTab('profile');
            }
          });
        } else {
          setActiveTab('profile');
        }
      })
      .catch(function(err) {
        console.warn('[App] Init error:', err);
        setActiveTab('profile');
      })
      .finally(function() { setLoading(false); });
  }, []);

  var handleProfileSelect = function(id) {
    setProfileId(id);
    window.setActiveProfileId(id);
    setActiveTab('interview');
    setInterviewPhase('tier1');
    setError(null);
    // Check interview state
    window.dbGet(window.STORE_PROFILES, id).then(function(p) {
      if (p && p.interviewComplete) {
        window.dbGet(window.STORE_PSI, id).then(function(psiData) {
          if (psiData) setPsi(psiData);
          if (p.credentialsComplete) {
            setInterviewPhase('done');
            setActiveTab('dashboard');
          } else if (psiData && psiData.solutions && psiData.solutions.length > 0) {
            setInterviewPhase('credentials');
          } else {
            setInterviewPhase('tier2');
          }
        });
      }
    });
  };

  var handleProfileCreated = function(profile) {
    if (!tourSeen || forceTour) {
      setProfileId(profile.id);
      window.setActiveProfileId(profile.id);
      setInterviewPhase('tour');
      setActiveTab('interview');
      setError(null);
      setForceTour(false);
    } else {
      handleProfileSelect(profile.id);
    }
  };

  var handleTier1Complete = function(newPsi) {
    // If there was a previous PSI, try to carry forward solutions and mappings for matching problem IDs
    if (psi && psi.solutions && psi.solutions.length > 0) {
      try {
        var newProbIds = {};
        (newPsi.problems || []).forEach(function(p) { newProbIds[p.id] = true; });
        var keptMappings = (psi.mappings || []).filter(function(m) { return newProbIds[m.problemId]; });
        var keptSolIds = {};
        keptMappings.forEach(function(m) { keptSolIds[m.solutionId] = true; });
        var keptSolutions = (psi.solutions || []).filter(function(s) { return keptSolIds[s.id]; });
        newPsi.solutions = keptSolutions;
        newPsi.mappings = keptMappings;
        if (keptSolutions.length < psi.solutions.length) {
          window.showToast('Some previous Initial Response answers could not be carried forward because situations changed. You may need to re-enter them.', 'warning');
        }
      } catch (err) {
        // Merge failed — proceed with fresh PSI (no solutions carried forward)
        console.error('[App] PSI merge failed, using fresh PSI:', err);
        window.showToast('I could not carry forward your previous Initial Response answers. Error: ' + (err.message || String(err)) + '. Your interview answers are saved, but you may need to re-enter situation details. Email techsupport@max-opp.com if this keeps happening.', 'error');
        newPsi.solutions = [];
        newPsi.mappings = [];
      }
    }
    setPsi(newPsi);
    setInterviewPhase('tier2');
  };

  var handleTier2Complete = function() {
    // tier2-view.js has already updated the PSI via onPsiUpdate during each drilldown.
    // Transition to finalize flow (satisfaction → grammar → upload decision).
    setInterviewPhase('finalize');
  };

  var handleTourComplete = function() {
    setTourSeen(true);
    window.dbPut(window.STORE_SETTINGS, { key: 'tourComplete', value: true }).catch(function(err) {
      console.error('[App] Tour flag save failed:', err);
    });
    setInterviewPhase('tier1');
  };

  var handleFinalizeComplete = function() {
    setInterviewPhase('credentials');
  };

  var handleBackToTier2 = function() {
    setInterviewPhase('tier2');
  };

  var handleCredentialsDone = function() {
    setInterviewPhase('done');
    setActiveTab('dashboard');
  };

  var handleRestartInterview = function() {
    if (!profileId) return;
    if (!confirm('Restart the interview? Your previous answers will be overwritten as you enter new ones.')) return;
    setInterviewPhase('tier1');
    setActiveTab('interview');
    setPsi(null);
    window.dbDelete(window.STORE_INTERVIEW, profileId).catch(function() {});
    window.dbDelete(window.STORE_PSI, profileId).catch(function() {});
    // Reset profile flags
    window.dbGet(window.STORE_PROFILES, profileId).then(function(p) {
      if (p) {
        p.interviewComplete = false;
        p.credentialsComplete = false;
        p.updatedAt = new Date().toISOString();
        window.dbPut(window.STORE_PROFILES, p);
      }
    });
  };

  var handleSetupNewProfile = function() {
    try {
      setForceTour(true);
      setPsi(null);
      setActiveTab('profile');
      setError(null);
    } catch (err) {
      console.error('[App] New profile setup failed:', err);
      setError('Could not start a new profile. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.');
    }
  };

  var handleSwitchProfile = function() {
    try {
      setActiveTab('profile');
      setError(null);
    } catch (err) {
      console.error('[App] Switch profile failed:', err);
      setError('Could not switch profiles. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.');
    }
  };

  var handleReupload = function() {
    try {
      setIsReupload(true);
      setInterviewPhase('finalize');
      setActiveTab('interview');
      setError(null);
    } catch (err) {
      console.error('[App] Re-upload failed:', err);
      setError('Could not start re-upload. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.');
    }
  };

  var handleEditTier1 = function() {
    if (!profileId) return;
    if (!confirm('Edit your interview answers? If you add, remove, or reorder situations, your Initial Response answers for those situations may need to be re-entered.')) return;
    try {
      // Go back to Tier 1 interview with saved answers intact (they load from IndexedDB)
      setInterviewPhase('tier1');
      setActiveTab('interview');
      setError(null);
      // Reset interviewComplete so Tier 1 can re-save
      window.dbGet(window.STORE_PROFILES, profileId).then(function(p) {
        if (p) {
          p.interviewComplete = false;
          p.updatedAt = new Date().toISOString();
          return window.dbPut(window.STORE_PROFILES, p);
        }
      }).catch(function(err) {
        console.error('[App] Edit tier1 profile update failed:', err);
        window.showToast('I opened the interview for editing, but had trouble updating your profile status. Error: ' + (err.message || String(err)) + '. Your answers are still intact. If you see issues, email techsupport@max-opp.com.', 'error');
      });
    } catch (err) {
      console.error('[App] Edit tier1 navigation failed:', err);
      setError('I could not navigate back to the interview. Error: ' + (err.message || String(err)) + '. Please try again, or email techsupport@max-opp.com.');
    }
  };

  var handleTabChange = function(tab) {
    if (tab === 'dashboard' && !psi) {
      // Don't block, just show empty dashboard
    }
    setActiveTab(tab);
    setError(null);
  };

  // Render
  if (loading) {
    return React.createElement('div', {
      style: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100dvh',
        background: t.bg, color: t.text,
      }
    },
      React.createElement('img', {
        src: 'Athena192x192.png', alt: 'Athena',
        style: { width: 80, height: 80, borderRadius: '50%', marginBottom: '1rem', animation: 'pulse 2s infinite' },
        onError: function(e) { e.target.style.display = 'none'; },
      }),
      React.createElement('p', { style: { fontFamily: t.fontDisplay, color: t.accent, fontSize: '1.5rem' } }, 'Loading Athena…'),
      React.createElement('style', null, '@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }')
    );
  }

  var content = null;
  if (activeTab === 'profile') {
    content = React.createElement(window.ProfileView, {
      activeProfileId: profileId,
      onProfileSelect: handleProfileSelect,
      onProfileCreated: handleProfileCreated,
    });
  } else if (activeTab === 'settings') {
    content = React.createElement(window.SettingsView, {});
  } else if (activeTab === 'dashboard') {
    content = React.createElement(window.DashboardView, {
      profileId: profileId,
      onStartTier2: function(problemId) { setResumeProblemId(problemId || null); setInterviewPhase('tier2'); setActiveTab('interview'); },
      onRestartInterview: handleRestartInterview,
      onEditTier1: handleEditTier1,
      onSetupNewProfile: handleSetupNewProfile,
      onSwitchProfile: handleSwitchProfile,
      onReupload: handleReupload,
    });
  } else if (activeTab === 'interview') {
    if (!profileId) {
      content = React.createElement('div', {
        style: { padding: '2rem', textAlign: 'center' }
      },
        React.createElement(window.OwlHeader, {}),
        React.createElement('p', { style: { color: t.textSecondary, marginTop: '2rem', lineHeight: 1.5 } },
          'Select or create a profile first.'),
        React.createElement(window.Button, {
          label: 'Go to Profiles',
          onClick: function() { setActiveTab('profile'); },
          style: { marginTop: '1rem' },
        })
      );
    } else if (interviewPhase === 'tour') {
      content = React.createElement(window.TourView, {
        onComplete: handleTourComplete,
      });
    } else if (interviewPhase === 'tier1') {
      content = React.createElement(window.InterviewView, {
        profileId: profileId,
        onComplete: handleTier1Complete,
      });
    } else if (interviewPhase === 'tier2') {
      content = React.createElement(window.Tier2View, {
        theme: window.getTheme(),
        psiDraft: psi,
        resumeProblemId: resumeProblemId,
        onResumed: function() { setResumeProblemId(null); },
        onPsiUpdate: function(updatedPsi) {
          setPsi(updatedPsi);
          window.dbPut(window.STORE_PSI, updatedPsi).catch(function(err) {
            console.error('[App] PSI update save failed:', err);
            window.showToast('Your PSI index could not be saved. Error: ' + (err.message || String(err)) + '. Please try again or email techsupport@max-opp.com.', 'error');
          });
        },
        onComplete: handleTier2Complete,
        onEditTier1: handleEditTier1,
      onSetupNewProfile: handleSetupNewProfile,
      onSwitchProfile: handleSwitchProfile,
      onReupload: handleReupload,
      });
    } else if (interviewPhase === 'finalize') {
      content = React.createElement(window.FinalizeView, {
        profileId: profileId,
        startPhase: isReupload ? 'upload' : 'satisfaction',
        onComplete: isReupload ? function() { setIsReupload(false); setInterviewPhase('done'); setActiveTab('dashboard'); } : handleFinalizeComplete,
        onBackToTier2: handleBackToTier2,
      });
    } else if (interviewPhase === 'credentials') {
      content = React.createElement(window.CredentialsView, {
        profileId: profileId,
        onComplete: handleCredentialsDone,
        onSkip: handleCredentialsDone,
      });
    } else {
      // done — show dashboard
      content = React.createElement(window.DashboardView, {
        profileId: profileId,
        onStartTier2: function(problemId) { setResumeProblemId(problemId || null); setInterviewPhase('tier2'); setActiveTab('interview'); },
        onRestartInterview: handleRestartInterview,
        onEditTier1: handleEditTier1,
      onSetupNewProfile: handleSetupNewProfile,
      onSwitchProfile: handleSwitchProfile,
      onReupload: handleReupload,
      });
    }
  }

  return React.createElement('div', {
    style: { display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: t.bg }
  },
    error ? React.createElement('div', { style: { padding: '0.75rem 1.25rem' } },
      React.createElement(window.ErrorBanner, { error: error, onDismiss: function() { setError(null); } })
    ) : null,
    React.createElement('div', { style: { flex: 1, overflowY: 'auto' } }, content),
    React.createElement(window.BottomNav, {
      activeTab: activeTab,
      onTabChange: handleTabChange,
      interviewComplete: !!psi,
    })
  );
}

// ─── Mount ─────────────────────────────────────────────────────────
var rootEl = document.getElementById('root');
if (rootEl) {
  rootEl.dataset.reactMounted = 'true';
  var root = ReactDOM.createRoot(rootEl);
  root.render(
    React.createElement(ErrorBoundary, null,
      React.createElement(AthenaApp)
    )
  );
}
