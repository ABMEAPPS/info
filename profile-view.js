/**
 * Athena — The Configurator
 * profile-view.js — Multi-SME profile management
 * Version: 0.2.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

window.ProfileView = function ProfileView({ activeProfileId, onProfileSelect, onProfileCreated }) {
  const t = window.getTheme();
  const [profiles, setProfiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  var loadProfiles = function() {
    setLoading(true);
    window.getAllProfiles()
      .then(function(list) {
        setProfiles(list || []);
        setLoading(false);
      })
      .catch(function(err) {
        setError(err.message || "I'm having trouble loading your profiles. Please try again.");
        setLoading(false);
      });
  };

  React.useEffect(function() { loadProfiles(); }, []);

  var handleCreate = function() {
    if (!newName.trim()) { setError('Please enter a name.'); return; }
    // Check for duplicates
    var dup = profiles.find(function(p) { return p.name.toLowerCase() === newName.trim().toLowerCase(); });
    if (dup) { setError(window.ERRORS.PROFILE_DUP.msg); return; }
    setCreating(true);
    setError(null);
    window.createProfile(newName)
      .then(function(profile) {
        setNewName('');
        setShowCreate(false);
        setCreating(false);
        loadProfiles();
        if (onProfileCreated) onProfileCreated(profile);
      })
      .catch(function(err) {
        setCreating(false);
        setError(err.message || "I wasn't able to create that profile. Please try again.");
      });
  };

  var handleDelete = function(profileId, profileName) {
    if (!confirm('Delete the profile "' + profileName + '"? This will remove all interview data for this profile. This cannot be undone.')) return;
    Promise.all([
      window.dbDelete(window.STORE_PROFILES, profileId),
      window.dbDelete(window.STORE_INTERVIEW, profileId),
      window.dbDelete(window.STORE_PSI, profileId),
      window.dbDelete(window.STORE_CREDENTIALS, profileId),
    ])
    .then(function() { loadProfiles(); })
    .catch(function(err) { setError(err.message || "I ran into a problem removing that profile. Please try again."); });
  };

  return React.createElement('div', {
    style: { flex: 1, padding: '1rem 1.25rem', paddingBottom: '5rem' }
  },
    // Version header — top right
    React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
    },
      React.createElement(window.OwlHeader, { subtitle: 'Profiles' }),
      React.createElement('span', {
        style: { fontSize: '0.8rem', color: t.textMuted, fontFamily: 'monospace' }
      }, 'v' + (window.ATHENA_VERSION || '?'))
    ),
    React.createElement('h2', {
      style: { fontFamily: t.fontDisplay, fontSize: '1.75rem', color: t.text, marginTop: '1rem', marginBottom: '0.35rem' }
    }, 'SME Profiles'),
    React.createElement('p', {
      style: { color: t.textSecondary, fontSize: '1.15rem', marginBottom: '1.25rem', lineHeight: 1.5 }
    }, 'Each profile holds one expert\'s knowledge. Select a profile to work with, or create a new one.'),

    error ? React.createElement(window.ErrorBanner, { error: error, onDismiss: function() { setError(null); } }) : null,

    loading ? React.createElement('p', { style: { color: t.textMuted } }, 'Loading profiles…') :
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
      profiles.length === 0
        ? React.createElement('p', { style: { color: t.textMuted, fontSize: '1.15rem' } }, 'No profiles yet. Create one to get started.')
        : profiles.map(function(p) {
            var isActive = p.id === activeProfileId;
            return React.createElement('div', {
              key: p.id,
              style: {
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: isActive ? t.accentMuted : t.bgCard,
                border: '1.5px solid ' + (isActive ? t.accent : t.border),
                borderRadius: 10, padding: '1.15rem 1.35rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              },
              onClick: function() { onProfileSelect(p.id); },
            },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', {
                  style: { fontWeight: 600, color: t.text, fontSize: '1.25rem' }
                }, p.name),
                React.createElement('div', {
                  style: { fontSize: '1rem', color: t.textMuted, marginTop: '0.2rem' }
                },
                  (p.interviewComplete ? '✓ Interview done' : 'Interview in progress') +
                  ' · ' + (p.verificationStatus || 'unverified')
                )
              ),
              isActive ? React.createElement('span', {
                style: { fontSize: '1rem', color: t.accent, fontWeight: 600, padding: '0.2rem 0.6rem', border: '1px solid ' + t.accent, borderRadius: 12 }
              }, 'Active') : null,
              React.createElement('button', {
                onClick: function(e) { e.stopPropagation(); handleDelete(p.id, p.name); },
                style: {
                  background: 'none', border: 'none', color: t.textMuted,
                  cursor: 'pointer', fontSize: '1.4rem', padding: '0.25rem',
                },
                'aria-label': 'Delete profile ' + p.name,
                title: 'Delete profile',
              }, '🗑')
            );
          })
    ),

    // Create profile
    React.createElement('div', { style: { marginTop: '1.5rem' } },
      showCreate
        ? React.createElement(window.Card, null,
            React.createElement('label', {
              style: { display: 'block', fontSize: '1.1rem', color: t.accent, fontWeight: 600, marginBottom: '0.5rem' }
            }, 'New profile name'),
            React.createElement(window.TextInput, {
              value: newName,
              onChange: setNewName,
              placeholder: 'e.g., Dr. Sarah Chen',
              maxLength: 120,
              autoFocus: true,
            }),
            React.createElement('div', {
              style: { display: 'flex', gap: '0.75rem', marginTop: '1rem' }
            },
              React.createElement(window.Button, {
                label: 'Cancel', variant: 'ghost',
                onClick: function() { setShowCreate(false); setNewName(''); setError(null); },
              }),
              React.createElement(window.Button, {
                label: creating ? 'Creating…' : 'Create Profile',
                onClick: handleCreate,
                disabled: creating,
              })
            )
          )
        : React.createElement(window.Button, {
            label: '+ New Profile',
            onClick: function() { setShowCreate(true); },
            style: { width: '100%' },
          })
    ),


    React.createElement('p', {
      style: { textAlign: 'center', fontSize: '1rem', color: t.textMuted, marginTop: '2rem' }
    }, window.COPYRIGHT + ' | v' + window.ATHENA_VERSION)
  );
};
