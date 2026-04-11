/**
 * Athena — The Configurator
 * finalize-view.js — Post-interview finalization flow
 * Version: 0.3.4.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

// ─── Finalize Flow ──────────────────────────────────────────────────────
// Phases: satisfaction → grammar → recap → upload → objection → done

window.FinalizeView = function FinalizeView(props) {
  var profileId = props.profileId;
  var onComplete = props.onComplete;   // called when finalize is done (proceed to credentials)
  var onBackToTier2 = props.onBackToTier2; // go back if not satisfied
  var startPhase = props.startPhase || 'satisfaction'; // allow skipping to 'upload' for re-uploads

  var t = window.getTheme();
  var useState = React.useState;
  var useEffect = React.useEffect;

  var [phase, setPhase] = useState(startPhase); // satisfaction | grammar | recap | upload | emailOffer | objection | done
  var [grammarResults, setGrammarResults] = useState(null);
  var [grammarError, setGrammarError] = useState(null);
  var [grammarScanning, setGrammarScanning] = useState(false);
  var [objectionText, setObjectionText] = useState('');
  var [psiDraft, setPsiDraft] = useState(null);
  var [recapSlide, setRecapSlide] = useState(0);
  var [uploading, setUploading] = useState(false);
  var [uploadError, setUploadError] = useState(null);
  var [emailAddress, setEmailAddress] = useState('');
  var [emailSending, setEmailSending] = useState(false);
  var [emailSent, setEmailSent] = useState(false);
  var [emailError, setEmailError] = useState(null);
  var [uploadedSubmissionId, setUploadedSubmissionId] = useState(null);

  // Done phase uses manual Continue button — no auto-advance

  // Load PSI on mount
  useEffect(function() {
    if (profileId) {
      window.dbGet(window.STORE_PSI, profileId).then(function(psi) {
        if (psi) setPsiDraft(psi);
      }).catch(function(err) {
        console.error('[Finalize] Could not load PSI:', err);
      });
    }
  }, [profileId]);

  // ─── Upload PSI to Cloudflare ─────────────────────────────────────
  var uploadPsi = function() {
    if (!psiDraft) {
      setUploadError('No PSI data found. Please go back and complete the interview.');
      return;
    }
    setUploading(true);
    setUploadError(null);

    // Step 1: Get or create device token
    var getToken = window.dbGet(window.STORE_SETTINGS, 'deviceToken')
      .then(function(record) {
        if (record && record.value) return record.value;
        // No token — register this device
        return fetch(window.API_BASE + '/v1/device-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: profileId }),
        })
        .then(function(res) {
          if (!res.ok) throw new Error('Registration failed (HTTP ' + res.status + ')');
          return res.json();
        })
        .then(function(data) {
          if (!data.token) throw new Error('No token received from server');
          // Save token to IndexedDB
          return window.dbPut(window.STORE_SETTINGS, { key: 'deviceToken', value: data.token })
            .then(function() { return data.token; });
        });
      });

    // Step 2: Submit PSI with token
    getToken
      .then(function(token) {
        return fetch(window.API_BASE + '/v1/psi-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({
            profileId: profileId,
            psi: psiDraft,
            athenaVersion: window.ATHENA_VERSION,
          }),
        });
      })
      .then(function(res) {
        if (!res.ok) {
          return res.json().then(function(err) {
            throw new Error(err.error || 'Upload failed (HTTP ' + res.status + ')');
          });
        }
        return res.json();
      })
      .then(function(data) {
        setUploading(false);
        setUploadedSubmissionId(data.submissionId || null);
        window.showToast('Your expertise has been uploaded successfully!', 'success');
        console.log('[Finalize] PSI uploaded. Submission ID:', data.submissionId);
        setPhase('emailOffer');
      })
      .catch(function(err) {
        setUploading(false);
        console.error('[Finalize] Upload failed:', err);
        setUploadError('Upload failed: ' + (err.message || String(err)) + '. Your data is safe on this device. Please try again or email techsupport@max-opp.com.');
      });
  };

  // ─── Shared Styles ──────────────────────────────────────────────────

  var containerStyle = {
    minHeight: '100vh',
    background: t.bg,
    padding: '1.5rem',
    fontFamily: t.fontBody,
    color: t.text,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  var cardStyle = {
    background: t.bgCard,
    border: '1px solid ' + t.border,
    borderRadius: '16px',
    padding: '2rem 1.5rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    marginTop: '1rem'
  };

  var titleStyle = {
    fontFamily: t.fontDisplay,
    fontSize: '1.5rem',
    color: t.accent,
    marginBottom: '0.75rem',
    fontWeight: 600
  };

  var bodyStyle = {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: t.textSecondary,
    whiteSpace: 'pre-line',
    marginBottom: '1.5rem'
  };

  var btnPrimary = {
    background: t.accent,
    color: t.bg,
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: t.fontBody,
    marginBottom: '0.5rem',
    width: '100%'
  };

  var btnSecondary = {
    background: 'transparent',
    color: t.accent,
    border: '1px solid ' + t.accent,
    borderRadius: '8px',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: t.fontBody,
    marginBottom: '0.5rem',
    width: '100%'
  };

  var btnMuted = {
    background: 'transparent',
    border: 'none',
    color: t.textMuted,
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: t.fontBody,
    marginTop: '0.75rem'
  };

  var iconStyle = { fontSize: '2.5rem', marginBottom: '0.75rem' };

  // ─── Grammar Scan ───────────────────────────────────────────────────

  function runGrammarScan() {
    if (!psiDraft) {
      setGrammarError('No interview data found to scan. Please go back and complete the interview.');
      return;
    }
    setGrammarScanning(true);
    setGrammarError(null);

    // Collect only user-entered answer text from tier2Progress (raw answers)
    var allText = [];
    try {
      var raw = localStorage.getItem('tier2Progress');
      var tier2Data = raw ? JSON.parse(raw) : {};
      Object.keys(tier2Data).forEach(function(probId) {
        var entry = tier2Data[probId];
        var ans = entry && entry.answers ? entry.answers : {};
        if (ans.primaryAdvice && ans.primaryAdvice.trim()) allText.push(ans.primaryAdvice.trim());
        if (ans.makesWorse && ans.makesWorse.trim()) allText.push(ans.makesWorse.trim());
        if (ans.escalationWhen && ans.escalationWhen.trim()) allText.push(ans.escalationWhen.trim());
        (ans.resources || []).forEach(function(r) {
          if (r.label && r.label.trim()) allText.push(r.label.trim());
        });
        (ans.additionalSolutions || []).forEach(function(s) {
          if (s.text && s.text.trim()) allText.push(s.text.trim());
        });
      });
    } catch (err) {
      console.error('[Finalize] Could not read tier2Progress:', err);
    }

    // Fallback: also pull from PSI solutions if tier2Progress was empty
    if (allText.length === 0 && psiDraft && psiDraft.solutions) {
      psiDraft.solutions.forEach(function(sol) {
        if (sol.guidance && sol.guidance.trim()) allText.push(sol.guidance.trim());
      });
    }

    var combined = allText.join('\n\n');
    if (!combined.trim()) {
      setGrammarResults('No text to review. Your responses appear to be empty. You may want to go back and add more detail.');
      setGrammarScanning(false);
      return;
    }
    var prompt = 'You are a professional editor. Review the following text for spelling errors, grammar mistakes, and unclear phrasing. For each issue found, provide: the original text, the suggested correction, and a brief explanation. Also note any areas where the meaning could be clearer. Format as a numbered list. If no issues are found, say "No issues found."\n\nText to review:\n' + combined;

    fetch(window.API_BASE + '/v1/help-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Server returned ' + res.status);
      return res.json();
    })
    .then(function(data) {
      var text = '';
      if (data && data.content && data.content.length > 0) {
        text = data.content.map(function(c) { return c.text || ''; }).join('\n');
      } else if (data && data.reply) {
        text = data.reply;
      }
      setGrammarResults(text || 'No issues found.');
      setGrammarScanning(false);
    })
    .catch(function(err) {
      console.error('[Finalize] Grammar scan failed:', err);
      setGrammarError('The grammar scan could not be completed right now. Error: ' + (err.message || String(err)) + '. You can skip this step or try again later. Email techsupport@max-opp.com if this persists.');
      setGrammarScanning(false);
    });
  }

  // ─── Phase: Satisfaction Check ──────────────────────────────────────

  if (phase === 'satisfaction') {
    return React.createElement('div', { style: containerStyle },
      React.createElement(window.OwlHeader, { subtitle: 'Review Your Responses' }),
      React.createElement('div', { style: cardStyle },
        React.createElement('div', { style: iconStyle }, '\u2705'),
        React.createElement('h2', { style: titleStyle }, 'Are You Satisfied?'),
        React.createElement('p', { style: bodyStyle },
          'You\u2019ve completed all the interview sections. Take a moment to consider whether your responses accurately capture your expertise.\n\nAre you satisfied with your answers?'
        ),
        React.createElement('button', {
          style: btnPrimary,
          onClick: function() { setPhase('grammar-offer'); }
        }, 'Yes, I\u2019m Satisfied'),
        React.createElement('button', {
          style: btnSecondary,
          onClick: function() {
            if (onBackToTier2) onBackToTier2();
          }
        }, 'No, Let Me Revise')
      )
    );
  }

  // ─── Phase: Offer Grammar Scan ──────────────────────────────────────

  if (phase === 'grammar-offer') {
    return React.createElement('div', { style: containerStyle },
      React.createElement(window.OwlHeader, { subtitle: 'Quality Check' }),
      React.createElement('div', { style: cardStyle },
        React.createElement('div', { style: iconStyle }, '\uD83D\uDD0D'),
        React.createElement('h2', { style: titleStyle }, 'Quick Quality Scan?'),
        React.createElement('p', { style: bodyStyle },
          'Would you like us to scan your responses for spelling, grammar, and clarity suggestions?\n\nThis takes just a moment and can help ensure your expertise is communicated as clearly as possible.'
        ),
        React.createElement('button', {
          style: btnPrimary,
          onClick: function() { setPhase('grammar'); runGrammarScan(); }
        }, 'Yes, Scan My Responses'),
        React.createElement('button', {
          style: btnSecondary,
          onClick: function() { setPhase('recap'); }
        }, 'No Thanks, Skip This')
      )
    );
  }

  // ─── Phase: Grammar Results ─────────────────────────────────────────

  if (phase === 'grammar') {
    return React.createElement('div', { style: containerStyle },
      React.createElement(window.OwlHeader, { subtitle: 'Quality Check' }),
      React.createElement('div', { style: Object.assign({}, cardStyle, { textAlign: 'left' }) },
        grammarScanning
          ? React.createElement('div', { style: { textAlign: 'center' } },
              React.createElement('div', { style: iconStyle }, '\u23F3'),
              React.createElement('p', { style: { color: t.textSecondary } }, 'Scanning your responses for spelling, grammar, and clarity\u2026')
            )
          : grammarError
            ? React.createElement('div', null,
                React.createElement('div', { style: Object.assign({}, iconStyle, { textAlign: 'center' }) }, '\u26A0\uFE0F'),
                React.createElement('p', { style: { color: t.error, marginBottom: '1rem' } }, grammarError),
                React.createElement('button', {
                  style: btnSecondary,
                  onClick: function() { runGrammarScan(); }
                }, 'Try Again'),
                React.createElement('button', {
                  style: Object.assign({}, btnMuted, { display: 'block', margin: '0.75rem auto 0' }),
                  onClick: function() { setPhase('recap'); }
                }, 'Skip and continue')
              )
            : React.createElement('div', null,
                React.createElement('h2', { style: Object.assign({}, titleStyle, { textAlign: 'center' }) }, 'Scan Results'),
                React.createElement('div', {
                  style: {
                    background: t.bgSecondary,
                    borderRadius: '8px',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: t.text,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: '1.5rem'
                  }
                }, grammarResults),
                React.createElement('p', { style: { color: t.textSecondary, fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' } },
                  'You can go back to revise your responses, or continue as-is.'
                ),
                React.createElement('button', {
                  style: btnPrimary,
                  onClick: function() { setPhase('recap'); }
                }, 'Continue'),
                React.createElement('button', {
                  style: btnSecondary,
                  onClick: function() {
                    if (onBackToTier2) onBackToTier2();
                  }
                }, 'Go Back and Revise')
              )
      )
    );
  }

  // ─── Phase: Security Recap (condensed tour) ─────────────────────────

  if (phase === 'recap') {
    var recapSlides = window.TOUR_RECAP_SLIDES || [];
    var currentRecap = recapSlides[recapSlide] || recapSlides[0];
    var isLastRecap = recapSlide >= recapSlides.length - 1;

    return React.createElement('div', { style: containerStyle },
      React.createElement(window.OwlHeader, { subtitle: 'Before You Decide' }),
      React.createElement('div', { style: cardStyle },
        React.createElement('div', { style: iconStyle }, currentRecap.icon),
        React.createElement('h2', { style: titleStyle }, currentRecap.title),
        React.createElement('p', { style: bodyStyle }, currentRecap.body),
        React.createElement('button', {
          style: btnPrimary,
          onClick: function() {
            if (isLastRecap) {
              setPhase('upload');
            } else {
              setRecapSlide(recapSlide + 1);
            }
          }
        }, isLastRecap ? 'I Understand \u2014 Continue' : 'Next'),

        // Dot indicators
        React.createElement('div', {
          style: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '1rem' }
        }, recapSlides.map(function(s, i) {
          return React.createElement('span', {
            key: s.id,
            style: {
              width: '8px', height: '8px', borderRadius: '50%',
              background: i === recapSlide ? t.accent : t.border
            }
          });
        })),

        recapSlide > 0 && React.createElement('button', {
          style: btnMuted,
          onClick: function() { setPhase('upload'); }
        }, 'Skip to decision')
      )
    );
  }

  // ─── Phase: Upload Decision ─────────────────────────────────────────

  if (phase === 'upload') {
    return React.createElement('div', { style: containerStyle },
      React.createElement(window.OwlHeader, { subtitle: 'Share Your Expertise' }),
      React.createElement('div', { style: cardStyle },
        React.createElement('div', { style: iconStyle }, '\uD83C\uDF10'),
        React.createElement('h2', { style: titleStyle }, 'Join the ABMe Experts Database?'),
        React.createElement('p', { style: bodyStyle },
          'Your expertise is ready. Would you like to upload your Problem/Solution Index to the ABMe platform?\n\nOnce uploaded, your knowledge will be available through ABMe applications to help people make better, expert-backed decisions.\n\nYour data is encrypted, secure, and you can edit or remove it at any time.'
        ),
        React.createElement('button', {
          style: Object.assign({}, btnPrimary, uploading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          onClick: function() { if (!uploading) uploadPsi(); },
          disabled: uploading
        }, uploading ? '\u23F3 Uploading\u2026' : '\u2705 Yes, Upload My Expertise'),

        uploadError ? React.createElement('div', {
          style: {
            background: 'rgba(220,50,50,0.1)',
            border: '1px solid ' + t.error,
            borderRadius: '8px',
            padding: '0.75rem',
            marginTop: '0.75rem',
            marginBottom: '0.5rem'
          }
        },
          React.createElement('p', { style: { color: t.error, fontSize: '0.9rem', margin: 0 } }, uploadError),
          React.createElement('button', {
            style: Object.assign({}, btnSecondary, { marginTop: '0.5rem', width: '100%' }),
            onClick: function() { if (!uploading) uploadPsi(); }
          }, 'Try Again')
        ) : null,

        React.createElement('button', {
          style: btnSecondary,
          onClick: function() { setPhase('objection'); }
        }, 'Not Right Now')
      )
    );
  }

  // ─── Phase: Objection Handling ──────────────────────────────────────

  if (phase === 'objection') {
    return React.createElement('div', { style: containerStyle },
      React.createElement(window.OwlHeader, { subtitle: 'We Understand' }),
      React.createElement('div', { style: cardStyle },
        React.createElement('div', { style: iconStyle }, '\uD83D\uDCAC'),
        React.createElement('h2', { style: titleStyle }, 'That\u2019s Okay'),
        React.createElement('p', { style: bodyStyle },
          'We completely respect your decision. Your responses are safely stored on this device and you can upload anytime from the Dashboard.\n\nIf there\u2019s something specific holding you back, we\u2019d love to know so we can address it:'
        ),
        React.createElement('textarea', {
          value: objectionText,
          onChange: function(e) { setObjectionText(e.target.value); },
          placeholder: 'What\u2019s your concern? (optional)',
          rows: 3,
          style: {
            width: '100%',
            background: t.bgInput,
            color: t.text,
            border: '1px solid ' + t.border,
            borderRadius: '8px',
            padding: '0.75rem',
            fontSize: '1rem',
            fontFamily: t.fontBody,
            resize: 'vertical',
            marginBottom: '1rem',
            boxSizing: 'border-box'
          }
        }),

        // Dynamic response based on common objections
        objectionText.trim().length > 0 && React.createElement('div', {
          style: {
            background: t.accentMuted,
            border: '1px solid ' + t.accentBorder,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'left'
          }
        },
          React.createElement('p', { style: { color: t.textSecondary, fontSize: '0.9rem', lineHeight: '1.5', margin: 0 } },
            'Thank you for sharing that. Your feedback helps us improve. Remember: you can upload anytime from the Dashboard, and you can always edit or remove your data after uploading.'
          )
        ),

        React.createElement('button', {
          style: btnPrimary,
          onClick: function() {
            // Log objection if provided (future: send to analytics)
            if (objectionText.trim()) {
              console.log('[Finalize] Upload declined. Reason:', objectionText.trim());
            }
            setPhase('done');
          }
        }, 'Continue Without Uploading'),
        React.createElement('button', {
          style: btnSecondary,
          onClick: function() { setPhase('upload'); }
        }, 'Actually, I\u2019ll Upload')
      )
    );
  }

  // ─── Phase: Email Confirmation Offer ──────────────────────────────

  if (phase === 'emailOffer') {
    var isValidEmail = emailAddress.trim().length > 0 && emailAddress.indexOf('@') > 0 && emailAddress.indexOf('.') > emailAddress.indexOf('@');

    return React.createElement('div', { style: containerStyle },
      React.createElement(window.OwlHeader, { subtitle: 'All Done!' }),
      React.createElement('div', { style: cardStyle },
        React.createElement('div', { style: iconStyle }, '\u2705'),
        React.createElement('h2', { style: titleStyle }, 'Upload Complete'),
        React.createElement('p', { style: bodyStyle },
          'Your expertise has been uploaded successfully.\n\nWould you like to receive a confirmation email with a summary of your submission?'
        ),
        React.createElement('p', {
          style: { fontSize: '0.85rem', color: t.textMuted, marginBottom: '1rem', fontStyle: 'italic' }
        }, 'Note: email is not considered a secure channel.'),

        emailSent
          ? React.createElement('div', {
              style: {
                background: 'rgba(76,175,130,0.15)', border: '1px solid ' + t.success,
                borderRadius: 8, padding: '0.75rem', marginBottom: '1rem'
              }
            }, React.createElement('p', { style: { color: t.success, margin: 0, fontSize: '1rem' } },
              '\u2709\uFE0F Confirmation sent to ' + emailAddress)
            )
          : React.createElement('div', null,
              React.createElement('input', {
                type: 'email',
                value: emailAddress,
                onChange: function(e) { setEmailAddress(e.target.value); setEmailError(null); },
                placeholder: 'Enter your email address',
                style: {
                  width: '100%',
                  background: t.bgInput || t.bgSecondary,
                  color: t.text,
                  border: '1px solid ' + t.border,
                  borderRadius: '8px',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  fontFamily: t.fontBody,
                  marginBottom: '0.75rem',
                  boxSizing: 'border-box'
                }
              }),
              emailError ? React.createElement('p', {
                style: { color: t.error, fontSize: '0.9rem', marginBottom: '0.75rem' }
              }, emailError) : null,
              React.createElement('button', {
                style: Object.assign({}, btnPrimary, (!isValidEmail || emailSending) ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                disabled: !isValidEmail || emailSending,
                onClick: function() {
                  if (!isValidEmail || emailSending) return;
                  setEmailSending(true);
                  setEmailError(null);
                  try {
                    // Future: POST to /v1/send-confirmation with email, submissionId, profileId
                    // When Resend endpoint is built, replace this block with:
                    // fetch(window.API_BASE + '/v1/send-confirmation', { ... })
                    //   .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
                    //   .then(function() { setEmailSending(false); setEmailSent(true); })
                    //   .catch(function(err) { ... });
                    console.log('[Finalize] Confirmation email requested:', emailAddress, 'Submission:', uploadedSubmissionId);
                    // Simulated success until Resend endpoint is built
                    setTimeout(function() {
                      setEmailSending(false);
                      setEmailSent(true);
                    }, 800);
                  } catch (err) {
                    setEmailSending(false);
                    setEmailError('Could not send confirmation: ' + (err.message || String(err)) + '. Your upload is safe. You can try again or email techsupport@max-opp.com.');
                    console.error('[Finalize] Email send failed:', err);
                  }
                }
              }, emailSending ? '\u23F3 Sending\u2026' : '\u2709\uFE0F Send Confirmation')
            ),

        React.createElement('button', {
          style: Object.assign({}, btnSecondary, { marginTop: '0.5rem' }),
          onClick: function() { setPhase('done'); }
        }, emailSent ? 'Continue' : 'No Thanks, Continue')
      )
    );
  }

  // ─── Phase: Done ────────────────────────────────────────────────────

  if (phase === 'done') {
    return React.createElement('div', { style: containerStyle },
      React.createElement('div', { style: Object.assign({}, cardStyle, { marginTop: '2rem', textAlign: 'left' }) },
        React.createElement('div', { style: Object.assign({}, iconStyle, { textAlign: 'center' }) }, '\uD83C\uDF89'),
        React.createElement('h2', { style: Object.assign({}, titleStyle, { textAlign: 'center' }) }, 'Thank You!'),
        React.createElement('p', { style: { color: t.textSecondary, lineHeight: 1.6, fontSize: '1rem', marginBottom: '1rem' } },
          'Thank you for your interest in helping people thrive. Your expertise will be reviewed and made available through ABMe applications to help people make better, expert-backed decisions.'
        ),
        React.createElement('a', {
          href: 'https://weathered-queen-3b68.abmeapps.workers.dev',
          target: '_blank',
          rel: 'noopener noreferrer',
          style: { color: t.accent, fontSize: '1.05rem', fontWeight: 600, display: 'block', marginBottom: '1rem' }
        }, 'Explore ABMe Prototype Apps'),
        React.createElement('p', { style: { color: t.textSecondary, lineHeight: 1.6, fontSize: '1rem', marginBottom: '0.5rem' } },
          'If you\u2019re interested in working with us to develop a client app \u2014 the type that references the data you and others have uploaded \u2014 please contact:'
        ),
        React.createElement('a', {
          href: 'mailto:ABMESuggestion@max-opp.com',
          style: { color: t.accent, fontSize: '1.05rem', fontWeight: 600, display: 'block', marginBottom: '1.25rem' }
        }, 'ABMESuggestion@max-opp.com'),

        React.createElement('div', {
          style: { borderTop: '1px solid ' + t.border, paddingTop: '1rem', marginTop: '0.5rem' }
        },
          React.createElement('p', {
            style: { fontSize: '0.85rem', color: t.textMuted, lineHeight: 1.5 }
          }, 'If you ever need help, write down our support email:'),
          React.createElement('p', {
            style: { fontSize: '1.05rem', color: t.accent, fontWeight: 600, marginTop: '0.25rem' }
          }, 'techsupport@max-opp.com')
        ),

        React.createElement('button', {
          style: Object.assign({}, btnPrimary, { marginTop: '1.25rem' }),
          onClick: function() { if (onComplete) onComplete(); }
        }, 'Continue to Credentials \u2192')
      )
    );
  }

  // Fallback
  return React.createElement('div', { style: containerStyle },
    React.createElement('p', { style: { color: t.error } }, 'Unexpected state. Please restart the app or email techsupport@max-opp.com.')
  );
};
