/**
 * Athena — The Configurator
 * credentials-view.js — Credential collection (post-interview)
 * Version: 0.3.4.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

window.CredentialsView = function CredentialsView({ profileId, onComplete, onSkip }) {
  const t = window.getTheme();
  const fields = window.CREDENTIAL_FIELDS;
  const [values, setValues] = React.useState({});
  const [error, setError] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(function() {
    if (!profileId) return;
    window.dbGet(window.STORE_CREDENTIALS, profileId)
      .then(function(rec) {
        if (rec && rec.data) setValues(rec.data);
        setLoaded(true);
      })
      .catch(function() { setLoaded(true); });
  }, [profileId]);

  var setField = function(id, val) {
    var next = Object.assign({}, values);
    next[id] = val;
    setValues(next);
  };

  var handleSave = function() {
    setSaving(true);
    setError(null);
    window.dbPut(window.STORE_CREDENTIALS, {
      profileId: profileId,
      data: values,
      updatedAt: new Date().toISOString(),
    })
    .then(function() {
      return window.dbGet(window.STORE_PROFILES, profileId);
    })
    .then(function(profile) {
      if (profile) {
        profile.credentialsComplete = true;
        profile.verificationStatus = 'pending';
        profile.updatedAt = new Date().toISOString();
        return window.dbPut(window.STORE_PROFILES, profile);
      }
    })
    .then(function() {
      // Attempt to attach credentials to the uploaded PSI submission
      // Future: POST to /v1/psi-update with credentials data
      return window.dbGet(window.STORE_SETTINGS, 'deviceToken').then(function(rec) {
        if (!rec || !rec.value) {
          console.log('[Credentials] No device token — PSI not yet uploaded, skipping credential attach.');
          return;
        }
        console.log('[Credentials] Device token found. Credential attach to server will be enabled when /v1/psi-update endpoint is built.');
        // When endpoint is ready, uncomment:
        // return fetch(window.API_BASE + '/v1/psi-update', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + rec.value },
        //   body: JSON.stringify({ profileId: profileId, credentials: values }),
        // }).then(function(res) {
        //   if (!res.ok) throw new Error('Credential upload failed (HTTP ' + res.status + ')');
        //   console.log('[Credentials] Credentials attached to server submission.');
        // });
      }).catch(function(err) {
        // Non-blocking — credentials saved locally even if server attach fails
        console.warn('[Credentials] Could not attach credentials to server:', err);
      });
    })
    .then(function() {
      setSaving(false);
      if (onComplete) onComplete();
    })
    .catch(function(err) {
      setSaving(false);
      setError((err.message || "I was not able to save your credentials.") + " Please try again, or email techsupport@max-opp.com.");
    });
  };

  if (!loaded) {
    return React.createElement('div', {
      style: { padding: '2rem', textAlign: 'center', color: t.textMuted }
    }, 'Loading…');
  }

  return React.createElement('div', {
    style: { flex: 1, padding: '1rem 1.25rem', paddingBottom: '5rem' }
  },
    React.createElement(window.OwlHeader, { subtitle: 'Credentials' }),
    React.createElement('h2', {
      style: { fontFamily: t.fontDisplay, fontSize: '1.75rem', color: t.text, marginTop: '1rem', marginBottom: '0.35rem' }
    }, "One last thing — your credentials"),
    React.createElement('p', {
      style: { color: t.textSecondary, fontSize: '1.15rem', lineHeight: 1.5, marginBottom: '0.5rem' }
    }, "I'll use this to verify your expertise. Everything you share stays on your device until you choose to submit it. All fields are optional — share what you're comfortable with."),
    React.createElement('p', {
      style: { color: t.textMuted, fontSize: '1.05rem', marginBottom: '1.25rem', lineHeight: 1.4 }
    }, "If you prefer not to share an ID number, you can type \"prefer not to share\" — we'll find another way to verify your credentials."),
    error ? React.createElement(window.ErrorBanner, { error: error, onDismiss: function() { setError(null); } }) : null,
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
      fields.map(function(f) {
        return React.createElement('div', { key: f.id },
          React.createElement('label', {
            style: { display: 'block', fontSize: '1.1rem', color: t.accent, fontWeight: 600, marginBottom: '0.35rem' }
          }, f.label),
          React.createElement(window.TextInput, {
            value: values[f.id] || '',
            onChange: function(v) { setField(f.id, v); },
            placeholder: f.placeholder,
            maxLength: f.maxLength,
          })
        );
      })
    ),
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }
    },
      React.createElement(window.Button, {
        label: 'Skip for Now',
        variant: 'ghost',
        onClick: onSkip,
      }),
      React.createElement(window.Button, {
        label: saving ? 'Saving…' : 'Save Credentials →',
        onClick: handleSave,
        disabled: saving,
      })
    )
  );
};
