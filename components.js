/**
 * Athena — The Configurator
 * components.js — Reusable UI components
 * Version: 0.3.1.1
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

const { useState, useCallback, useRef, useEffect } = React;

// ─── Styles Helper ─────────────────────────────────────────────────
window.s = function(styleObj) { return styleObj; };

// ─── Owl Header (branding on every screen) ─────────────────────────
window.OwlHeader = function OwlHeader({ subtitle }) {
  const t = window.getTheme();
  return React.createElement('div', {
    style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }
  },
    React.createElement('img', {
      src: 'Athena192x192.png',
      alt: 'Athena',
      style: { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' },
      onError: function(e) {
        e.target.style.display = 'none';
      }
    }),
    React.createElement('div', null,
      React.createElement('span', {
        style: { fontFamily: t.fontDisplay, fontSize: '1.75rem', fontWeight: 600, color: t.accent }
      }, 'Athena'),
      subtitle ? React.createElement('span', {
        style: { display: 'block', fontSize: '1rem', color: t.textMuted }
      }, subtitle) : null
    )
  );
};

// ─── Bottom Navigation Bar ─────────────────────────────────────────
window.BottomNav = function BottomNav({ activeTab, onTabChange, interviewComplete }) {
  const t = window.getTheme();
  const tabs = [
    { id: 'interview', label: 'Interview', icon: '📋' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'Profiles', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return React.createElement('nav', {
    style: {
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: t.bgNav,
      borderTop: '1px solid ' + t.border,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      height: 80,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 1000,
      fontFamily: t.fontBody,
    }
  },
    // Version badge — top-right corner of nav bar
    React.createElement('div', {
      style: {
        position: 'absolute', top: '2px', right: '8px',
        fontSize: '9px', color: t.textMuted, opacity: 0.6,
        fontFamily: 'monospace', letterSpacing: '0.5px',
        pointerEvents: 'none'
      }
    }, 'v' + (window.ATHENA_VERSION || '?')),
    tabs.map(function(tab) {
      var isActive = activeTab === tab.id;
      return React.createElement('button', {
        key: tab.id,
        onClick: function() { onTabChange(tab.id); },
        style: {
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '0.35rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: isActive ? t.accent : t.textMuted,
          fontSize: '0.85rem', fontFamily: t.fontBody, fontWeight: isActive ? 600 : 400,
          padding: '0.5rem 0',
          transition: 'color 0.2s',
          opacity: (tab.id === 'dashboard' && !interviewComplete) ? 0.4 : 1,
        },
        'aria-label': tab.label,
        'aria-current': isActive ? 'page' : undefined,
      },
        React.createElement('span', { style: { fontSize: '1.4rem' } }, tab.icon),
        React.createElement('span', null, tab.label)
      );
    })
  );
};

// ─── Error Banner ──────────────────────────────────────────────────
window.ErrorBanner = function ErrorBanner({ error, onDismiss }) {
  const t = window.getTheme();
  if (!error) return null;
  var msg = typeof error === 'string' ? error : (error.message || error.msg || 'Something unexpected happened.');
  var code = (error && error.code) ? error.code : null;
  return React.createElement('div', {
    role: 'alert',
    style: {
      background: t.errorBg, border: '1px solid ' + t.error,
      borderRadius: 8, padding: '1.15rem 1.35rem', marginBottom: '1rem',
      fontFamily: t.fontBody,
    }
  },
    React.createElement('div', {
      style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }
    },
      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: '1.1rem', color: t.error, lineHeight: 1.4 } }, msg),
        code ? React.createElement('div', {
          style: { fontSize: '0.85rem', color: t.textMuted, marginTop: '0.35rem' }
        }, 'Ref: ' + code + ' — if this keeps happening, contact techsupport@max-opp.com') : null
      ),
      onDismiss ? React.createElement('button', {
        onClick: onDismiss,
        style: {
          background: 'none', border: 'none', color: t.error,
          cursor: 'pointer', fontSize: '1.4rem', padding: '0 0.25rem',
          flexShrink: 0,
        },
        'aria-label': 'Dismiss',
      }, '×') : null
    )
  );
};

// ─── Card ──────────────────────────────────────────────────────────
window.Card = function Card({ children, style, onClick }) {
  const t = window.getTheme();
  return React.createElement('div', {
    onClick: onClick || undefined,
    style: Object.assign({
      background: t.bgCard, borderRadius: 12,
      border: '1px solid ' + t.border,
      padding: '1.5rem',
    }, style || {})
  }, children);
};

// ─── Text Input ────────────────────────────────────────────────────
window.TextInput = function TextInput({ value, onChange, placeholder, maxLength, disabled, autoFocus, multiline }) {
  const t = window.getTheme();
  var tag = multiline ? 'textarea' : 'input';
  var baseStyle = {
    width: '100%', padding: '1.1rem 1.15rem',
    background: t.bgInput, color: t.text,
    border: '1.5px solid ' + t.accentBorder,
    borderRadius: 8, fontSize: '1.25rem',
    fontFamily: t.fontBody,
    outline: 'none',
    transition: 'border-color 0.2s',
  };
  if (multiline) {
    baseStyle.lineHeight = '1.6';
    baseStyle.resize = 'vertical';
    baseStyle.minHeight = '10rem';
    baseStyle.overflowY = 'auto';
  }
  var props = {
    value: value || '',
    onChange: function(e) { onChange(e.target.value); },
    placeholder: placeholder || '',
    maxLength: maxLength || (multiline ? 2000 : 500),
    disabled: disabled,
    autoFocus: autoFocus,
    style: baseStyle,
    onFocus: function(e) { e.target.style.borderColor = t.accent; },
    onBlur: function(e) { e.target.style.borderColor = t.accentBorder; },
  };
  if (!multiline) { props.type = 'text'; }
  if (multiline) { props.rows = 6; }
  return React.createElement(tag, props);
};

// ─── Textarea Input (larger area for detailed input) ───────────────
window.TextAreaInput = function TextAreaInput({ value, onChange, placeholder, maxLength, rows, disabled }) {
  const t = window.getTheme();
  return React.createElement('textarea', {
    value: value || '',
    onChange: function(e) { onChange(e.target.value); },
    placeholder: placeholder || '',
    maxLength: maxLength || 1000,
    rows: rows || 5,
    disabled: disabled,
    style: {
      width: '100%', padding: '1.1rem 1.15rem',
      background: t.bgInput, color: t.text,
      border: '1.5px solid ' + t.accentBorder,
      borderRadius: 8, fontSize: '1.25rem',
      fontFamily: t.fontBody, lineHeight: 1.6,
      outline: 'none', resize: 'vertical',
      minHeight: '10rem',
      transition: 'border-color 0.2s',
    },
    onFocus: function(e) { e.target.style.borderColor = t.accent; },
    onBlur: function(e) { e.target.style.borderColor = t.accentBorder; },
  });
};

// ─── Word / Char Counter ───────────────────────────────────────────
window.CharCounter = function CharCounter({ value, maxLength }) {
  const t = window.getTheme();
  var len = (value || '').length;
  var pct = maxLength ? len / maxLength : 0;
  var color = pct > 0.9 ? t.error : (pct > 0.7 ? t.warning : t.textMuted);
  return React.createElement('div', {
    style: { textAlign: 'right', fontSize: '1rem', color: color, marginTop: '0.25rem', fontFamily: t.fontBody }
  }, len + ' / ' + (maxLength || '∞'));
};

// ─── Input Mode Tabs (Type / Scan — dictate removed) ───────────────
window.InputModeTabs = function InputModeTabs({ activeMode, onModeChange }) {
  const t = window.getTheme();
  var modes = [
    { id: 'type', label: 'Type' },
    { id: 'scan', label: 'Scan' },
  ];
  return React.createElement('div', {
    style: {
      display: 'flex', gap: '0.5rem', marginBottom: '0.75rem',
    }
  },
    modes.map(function(m) {
      var isActive = activeMode === m.id;
      return React.createElement('button', {
        key: m.id,
        onClick: function() { onModeChange(m.id); },
        style: {
          padding: '0.6rem 1.15rem', borderRadius: 6,
          background: isActive ? t.accentMuted : 'transparent',
          border: '1px solid ' + (isActive ? t.accent : t.border),
          color: isActive ? t.accent : t.textSecondary,
          fontSize: '1.1rem', fontFamily: t.fontBody,
          cursor: 'pointer', fontWeight: isActive ? 600 : 400,
          transition: 'all 0.2s',
        }
      }, m.label);
    })
  );
};

// ─── Scan Panel ────────────────────────────────────────────────────
window.ScanPanel = function ScanPanel({ onTextExtracted }) {
  const t = window.getTheme();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  var handleScan = function() {
    setScanning(true);
    setError(null);
    window.pickImage()
      .then(function(dataUrl) {
        return window.callOcr(dataUrl);
      })
      .then(function(text) {
        setScanning(false);
        if (onTextExtracted) onTextExtracted(text);
      })
      .catch(function(err) {
        setScanning(false);
        setError(err.message || 'Scan failed');
      });
  };

  return React.createElement('div', {
    style: {
      border: '2px dashed ' + t.accentBorder, borderRadius: 12,
      padding: '2rem', textAlign: 'center',
      background: t.accentMuted,
    }
  },
    error ? React.createElement(window.ErrorBanner, { error: error, onDismiss: function() { setError(null); } }) : null,
    React.createElement('button', {
      onClick: handleScan,
      disabled: scanning,
      style: {
        background: t.accent, color: t.bg,
        border: 'none', borderRadius: 8,
        padding: '1rem 1.75rem', fontSize: '1.2rem',
        fontFamily: t.fontBody, fontWeight: 600,
        cursor: scanning ? 'wait' : 'pointer',
        opacity: scanning ? 0.6 : 1,
      }
    }, scanning ? 'Scanning…' : '📷  Scan a Document'),
    React.createElement('p', {
      style: { fontSize: '1.05rem', color: t.textMuted, marginTop: '0.75rem' }
    }, 'Take a photo of a printed document and I\'ll extract the text.')
  );
};

// ─── Situation Builder (multi-item) ────────────────────────────────
window.SituationBuilder = function SituationBuilder({ items, onChange, placeholder, addLabel, maxItems, maxLength, hint }) {
  const t = window.getTheme();
  var list = Array.isArray(items) && items.length > 0 ? items : [''];
  // Track which items have already shown the split suggestion
  var shownRef = React.useRef({});
  var hintText = hint || '\uD83D\uDCA1 One situation per box. Use a verb phrase like \u201Cobtain relief from\u201D or \u201Celiminate\u201D followed by the condition.';

  var updateItem = function(index, val) {
    try {
      var next = list.slice();
      next[index] = val;
      onChange(next);
      // If over 255 chars and we haven't suggested splitting for this item yet
      if (val.length > 255 && !shownRef.current[index]) {
        shownRef.current[index] = true;
        window.showToast('That\u2019s getting long \u2014 would it be better as two separate situations? For example, \u201Cobtain relief from Sciatica\u201D in one box and \u201Celiminate Knee pain\u201D in another. Tap \u201C+ Add another\u201D below to split them up.', 'warning');
      }
    } catch (err) {
      console.error('[SituationBuilder] Update failed:', err);
      window.showToast('I had trouble updating that entry. Error: ' + (err.message || String(err)) + '. If this keeps happening, email techsupport@max-opp.com.', 'error');
    }
  };

  var removeItem = function(index) {
    if (list.length <= 1) return;
    var next = list.filter(function(_, i) { return i !== index; });
    onChange(next);
  };

  var addItem = function() {
    if (list.length >= (maxItems || 20)) return;
    onChange(list.concat(['']));
  };

  // Auto-split pasted text containing commas or newlines
  var handlePaste = function(index, e) {
    try {
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      if (!pasted) return;
      var delimiters = /[,\n\r]+/;
      if (delimiters.test(pasted)) {
        e.preventDefault();
        var parts = pasted.split(delimiters).map(function(s) { return s.trim(); }).filter(Boolean);
        if (parts.length <= 1) {
          updateItem(index, parts[0] || pasted.trim());
          return;
        }
        var next = list.slice();
        next[index] = parts[0];
        var remaining = parts.slice(1);
        var max = maxItems || 20;
        remaining.forEach(function(part) {
          if (next.length < max) next.push(part);
        });
        onChange(next);
        window.showToast('Split into ' + Math.min(parts.length, max - list.length + 1) + ' separate situations', 'success');
      }
    } catch (err) {
      // Paste auto-split failed — let the browser handle the paste normally
      console.warn('[SituationBuilder] Paste split failed, falling back to normal paste:', err);
    }
  };

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' } },
    // Instructional hint
    React.createElement('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.6rem 0.85rem', borderRadius: 8,
        background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
        fontSize: '0.95rem', color: t.accent, lineHeight: 1.4,
      }
    }, hintText),
    list.map(function(item, i) {
      return React.createElement('div', {
        key: i,
        style: { display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }
      },
        React.createElement('span', {
          style: { color: t.accent, fontWeight: 600, fontSize: '1.15rem', marginTop: '0.85rem', minWidth: '1.5rem' }
        }, (i + 1) + '.'),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('textarea', {
            value: item,
            onChange: function(e) { updateItem(i, e.target.value); },
            onPaste: function(e) { handlePaste(i, e); },
            placeholder: placeholder || '',
            maxLength: maxLength || 300,
            rows: 2,
            style: {
              width: '100%', padding: '1rem 1.1rem',
              background: t.bgInput, color: t.text,
              border: '1.5px solid ' + t.accentBorder,
              borderRadius: 8, fontSize: '1.2rem',
              fontFamily: t.fontBody, lineHeight: 1.5,
              outline: 'none', resize: 'vertical',
            },
            onFocus: function(e) { e.target.style.borderColor = t.accent; },
            onBlur: function(e) { e.target.style.borderColor = t.accentBorder; },
          }),
          React.createElement(window.CharCounter, { value: item, maxLength: maxLength || 300 })
        ),
        list.length > 1 ? React.createElement('button', {
          onClick: function() { removeItem(i); },
          'aria-label': 'Remove situation ' + (i + 1),
          style: {
            background: 'none', border: 'none', color: t.error,
            cursor: 'pointer', fontSize: '1.5rem', marginTop: '0.65rem',
            padding: '0.25rem',
          }
        }, '\u00D7') : null
      );
    }),
    list.length < (maxItems || 20) ? React.createElement('button', {
      onClick: addItem,
      style: {
        background: 'none', border: '1.5px dashed ' + t.accentBorder,
        borderRadius: 8, padding: '0.85rem',
        color: t.accent, fontSize: '1.15rem',
        fontFamily: t.fontBody, cursor: 'pointer',
        transition: 'all 0.2s',
      }
    }, addLabel || '+ Add another') : null
  );
};

// ─── Pill / PillRow ────────────────────────────────────────────────
window.Pill = function Pill({ label, active, onClick }) {
  const t = window.getTheme();
  return React.createElement('button', {
    onClick: onClick,
    style: {
      padding: '0.5rem 1rem', borderRadius: 20,
      background: active ? t.accent : 'transparent',
      color: active ? t.bg : t.textSecondary,
      border: '1px solid ' + (active ? t.accent : t.border),
      fontSize: '1.05rem', fontFamily: t.fontBody,
      cursor: 'pointer', fontWeight: active ? 600 : 400,
      transition: 'all 0.2s',
    }
  }, label);
};

window.PillRow = function PillRow({ children }) {
  return React.createElement('div', {
    style: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }
  }, children);
};

// ─── Progress Bar ──────────────────────────────────────────────────
window.ProgressBar = function ProgressBar({ current, total }) {
  const t = window.getTheme();
  var pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return React.createElement('div', {
    style: { width: '100%', height: 6, background: t.border, borderRadius: 3, overflow: 'hidden' },
    role: 'progressbar',
    'aria-valuenow': pct,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
  },
    React.createElement('div', {
      style: {
        height: '100%', width: pct + '%',
        background: 'linear-gradient(90deg, ' + t.accent + ', ' + t.accentHover + ')',
        borderRadius: 2,
        transition: 'width 0.4s ease',
      }
    })
  );
};

// ─── Button ────────────────────────────────────────────────────────
window.Button = function Button({ label, onClick, variant, disabled, style: extraStyle }) {
  const t = window.getTheme();
  var isPrimary = variant === 'primary' || !variant;
  var base = {
    padding: '1rem 1.75rem', borderRadius: 8,
    fontSize: '1.2rem', fontFamily: t.fontBody, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
  };
  if (isPrimary) {
    base.background = t.accent;
    base.color = t.bg;
  } else {
    base.background = 'transparent';
    base.color = t.textSecondary;
    base.border = '1px solid ' + t.border;
  }
  return React.createElement('button', {
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: Object.assign(base, extraStyle || {}),
  }, label);
};
