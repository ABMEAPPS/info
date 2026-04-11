/**
 * Athena — The Configurator
 * dashboard-view.js — PSI dashboard with export and Tier 2 access
 * Version: 0.3.4.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

window.DashboardView = function DashboardView({ profileId, onStartTier2, onRestartInterview, onEditTier1, onSetupNewProfile, onSwitchProfile, onReupload }) {
  const t = window.getTheme();
  const [psi, setPsi] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [exportMsg, setExportMsg] = React.useState(null);

  React.useEffect(function() {
    if (!profileId) { setLoading(false); return; }
    Promise.all([
      window.dbGet(window.STORE_PSI, profileId),
      window.dbGet(window.STORE_PROFILES, profileId),
    ])
    .then(function(results) {
      setPsi(results[0] || null);
      setProfile(results[1] || null);
      setLoading(false);
    })
    .catch(function(err) {
      setError(err.message || "I'm having trouble loading your dashboard. Please try again in a moment.");
      setLoading(false);
    });
  }, [profileId]);

  var handleExport = function() {
    if (!psi) return;
    try {
      var json = JSON.stringify(psi, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'psi-draft-' + profileId + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMsg('PSI JSON exported successfully.');
      setTimeout(function() { setExportMsg(null); }, 3000);
    } catch (err) {
      setError("I was not able to export your PSI file. Error: " + (err.message || String(err)) + ". Please try again, or email techsupport@max-opp.com.");
    }
  };

  if (loading) {
    return React.createElement('div', {
      style: { padding: '2rem', textAlign: 'center', color: t.textMuted }
    }, 'Loading dashboard…');
  }

  if (!psi) {
    return React.createElement('div', {
      style: { flex: 1, padding: '1.5rem 1.25rem', paddingBottom: '5rem', textAlign: 'center' }
    },
      React.createElement(window.OwlHeader, { subtitle: 'Dashboard' }),
      React.createElement('p', {
        style: { color: t.textSecondary, marginTop: '3rem', fontSize: '1.25rem', lineHeight: 1.5 }
      }, "I don't have any data for this profile yet. Complete the interview first, and your PSI will appear here."),
      React.createElement(window.Button, {
        label: 'Go to Interview',
        onClick: onRestartInterview,
        style: { marginTop: '1.5rem' },
      })
    );
  }

  var probCount = (psi.problems || []).length;
  var solCount = (psi.solutions || []).length;
  var mapCount = (psi.mappings || []).length;

  return React.createElement('div', {
    style: { flex: 1, padding: '1rem 1.25rem', paddingBottom: '5rem' }
  },
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
    },
      React.createElement(window.OwlHeader, { subtitle: 'Dashboard' }),
      React.createElement('span', {
        style: { fontSize: '0.8rem', color: t.textMuted, fontFamily: 'monospace' }
      }, 'v' + (window.ATHENA_VERSION || '?'))
    ),
    error ? React.createElement(window.ErrorBanner, { error: error, onDismiss: function() { setError(null); } }) : null,
    exportMsg ? React.createElement('div', {
      style: { background: 'rgba(76,175,130,0.15)', border: '1px solid ' + t.success, borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '1.1rem', color: t.success }
    }, exportMsg) : null,

    // SME summary
    React.createElement(window.Card, { style: { marginTop: '1rem' } },
      React.createElement('h3', {
        style: { fontFamily: t.fontDisplay, fontSize: '1.5rem', color: t.accent, marginBottom: '0.5rem' }
      }, (psi.sme && psi.sme.name) || 'SME Profile'),
      (psi.sme && psi.sme.practice) ? React.createElement('p', { style: { color: t.textSecondary, fontSize: '1.15rem' } }, psi.sme.practice) : null,
      (psi.sme && psi.sme.domain) ? React.createElement('p', { style: { color: t.textMuted, fontSize: '1.1rem', marginTop: '0.25rem' } }, psi.sme.domain) : null,
      profile ? React.createElement('p', {
        style: { fontSize: '1rem', color: t.textMuted, marginTop: '0.5rem' }
      }, 'Status: ' + (profile.verificationStatus || 'unverified')) : null,
      onSwitchProfile ? React.createElement('button', {
        onClick: function() {
          try { onSwitchProfile(); } catch (err) {
            console.error('[Dashboard] Switch profile failed:', err);
          }
        },
        style: {
          background: 'transparent', border: 'none', color: t.accent,
          fontSize: '0.9rem', cursor: 'pointer', fontFamily: t.fontBody,
          marginTop: '0.5rem', padding: 0, textDecoration: 'underline'
        }
      }, 'Switch Profile') : null
    ),

    // PSI stats
    React.createElement('div', {
      style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }
    },
      [
        { label: 'Problems', count: probCount },
        { label: 'Solutions', count: solCount },
        { label: 'Mappings', count: mapCount },
      ].map(function(stat) {
        return React.createElement(window.Card, { key: stat.label, style: { textAlign: 'center', padding: '1rem 0.5rem' } },
          React.createElement('div', {
            style: { fontSize: '2.4rem', fontWeight: 700, color: t.accent, fontFamily: t.fontDisplay }
          }, stat.count),
          React.createElement('div', {
            style: { fontSize: '1rem', color: t.textMuted, marginTop: '0.15rem' }
          }, stat.label)
        );
      })
    ),

    // Problems list — clickable to resume/start Tier 2
    React.createElement('h3', {
      style: { fontFamily: t.fontDisplay, fontSize: '1.4rem', color: t.text, marginTop: '1.5rem', marginBottom: '0.5rem' }
    }, 'Situations (Problems)'),
    React.createElement('p', {
      style: { fontSize: '0.9rem', color: t.textMuted, marginBottom: '0.75rem' }
    }, 'Tap a situation to review or continue it.'),
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
      (psi.problems || []).map(function(p) {
        return React.createElement(window.Card, {
          key: p.id,
          style: { padding: '1.1rem 1.25rem', cursor: 'pointer', transition: 'border-color 0.2s', border: '1.5px solid ' + t.cardBorder },
          onClick: function() {
            try {
              if (onStartTier2) onStartTier2(p.id);
            } catch (err) {
              setError('Could not open situation: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.');
            }
          }
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { color: t.text, fontSize: '1.15rem' } }, p.label),
            React.createElement('span', {
              style: {
                fontSize: '1rem', padding: '0.2rem 0.5rem', borderRadius: 10,
                background: t.accentMuted, color: t.accent,
              }
            }, p.id)
          )
        );
      })
    ),

    // Actions
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }
    },
      probCount > 0
        ? React.createElement(window.Button, {
            label: (solCount === 0 ? 'Start' : 'Resume') + ' Initial Response \u2192',
            onClick: function() { if (onStartTier2) onStartTier2(); },
            style: { width: '100%' },
          })
        : null,
      onEditTier1
        ? React.createElement(window.Button, {
            label: '\u270F\uFE0F Edit Interview Answers',
            onClick: function() {
              try {
                onEditTier1();
              } catch (err) {
                console.error('[Dashboard] Edit tier1 failed:', err);
                setError('I could not navigate back to edit. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.');
              }
            },
            variant: 'ghost',
            style: { width: '100%' },
          })
        : null,
      React.createElement(window.Button, {
        label: '\uD83D\uDCE4 Export PSI as JSON',
        onClick: handleExport,
        variant: 'ghost',
        style: { width: '100%' },
      }),
      onReupload
        ? React.createElement(window.Button, {
            label: '\uD83D\uDD04 Update Upload',
            onClick: function() {
              try {
                onReupload();
              } catch (err) {
                console.error('[Dashboard] Re-upload failed:', err);
                setError('Could not start re-upload. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.');
              }
            },
            variant: 'ghost',
            style: { width: '100%' },
          })
        : null,
      React.createElement(window.Button, {
        label: '\u274C Request Data Removal',
        onClick: function() {
          try {
            var subject = encodeURIComponent('Data Removal Request — Profile ' + profileId);
            var body = encodeURIComponent('I would like to request removal of my uploaded data.\n\nProfile ID: ' + profileId + '\nName: ' + ((psi && psi.sme && psi.sme.name) || 'N/A') + '\n\nPlease confirm when my data has been removed.');
            window.open('mailto:techsupport@max-opp.com?subject=' + subject + '&body=' + body, '_self');
          } catch (err) {
            console.error('[Dashboard] Removal request failed:', err);
            setError('Could not open email. Please email techsupport@max-opp.com directly and reference Profile ID: ' + profileId);
          }
        },
        variant: 'ghost',
        style: { width: '100%' },
      }),
      React.createElement(window.Button, {
        label: 'Restart Interview',
        onClick: onRestartInterview,
        variant: 'ghost',
        style: { width: '100%' },
      }),
      onSetupNewProfile
        ? React.createElement(window.Button, {
            label: '\uD83D\uDC64 Set Up Another Profile',
            onClick: function() {
              try {
                onSetupNewProfile();
              } catch (err) {
                console.error('[Dashboard] New profile failed:', err);
                setError('I could not start a new profile. Error: ' + (err.message || String(err)) + '. Email techsupport@max-opp.com if this persists.');
              }
            },
            variant: 'ghost',
            style: { width: '100%' },
          })
        : null
    ),

    // Explore apps link
    React.createElement('div', {
      style: { textAlign: 'center', marginTop: '1.5rem' }
    },
      React.createElement('a', {
        href: 'https://weathered-queen-3b68.abmeapps.workers.dev',
        target: '_blank',
        rel: 'noopener noreferrer',
        style: { color: t.accent, fontSize: '1rem', textDecoration: 'none', fontWeight: 500 }
      }, 'Explore ABMe Prototype Apps \u2192')
    ),

    // Copyright
    React.createElement('p', {
      style: { textAlign: 'center', fontSize: '1rem', color: t.textMuted, marginTop: '2rem' }
    }, window.COPYRIGHT + ' | v' + window.ATHENA_VERSION)
  );
};
