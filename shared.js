/**
 * Athena — The Configurator
 * shared.js — Shared utilities, constants, IndexedDB, themes, error catalog
 * Version: 0.3.4.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

// ─── Version ───────────────────────────────────────────────────────
window.ATHENA_VERSION = '0.3.4.0';
window.APP_NAME = 'Athena';
window.COPYRIGHT = 'Copyright 2026 by Alan H. Jordan | All Rights Reserved';

// ─── API ───────────────────────────────────────────────────────────
window.API_BASE = 'https://abme-api.abmeapps.workers.dev';
window.TIER2_KEY = ''; // populated from env/config if needed

// ─── Theme ─────────────────────────────────────────────────────────
window.THEMES = {
  dark: {
    name: 'dark',
    bg: '#0D1024',
    bgSecondary: '#151833',
    bgCard: '#1A1E3A',
    bgInput: '#1A1E3A',
    bgNav: '#0A0D1C',
    accent: '#C9A84C',
    accentHover: '#D4B85E',
    accentMuted: 'rgba(201,168,76,0.15)',
    accentBorder: 'rgba(201,168,76,0.4)',
    text: '#E8E0D0',
    textSecondary: '#9A9BAF',
    textMuted: '#6B6D80',
    border: '#2A2D4A',
    success: '#4CAF82',
    warning: '#E8A84C',
    error: '#CF6679',
    errorBg: 'rgba(207,102,121,0.1)',
    fontDisplay: "'Cormorant Garamond', serif",
    fontBody: "'DM Sans', sans-serif",
  },
  light: {
    name: 'light',
    bg: '#F5F0E8',
    bgSecondary: '#EDE7DA',
    bgCard: '#FFFFFF',
    bgInput: '#FFFFFF',
    bgNav: '#FDFBF7',
    accent: '#8B7335',
    accentHover: '#A08540',
    accentMuted: 'rgba(139,115,53,0.1)',
    accentBorder: 'rgba(139,115,53,0.3)',
    text: '#1A1E3A',
    textSecondary: '#5A5D70',
    textMuted: '#8A8D9F',
    border: '#D5CFC2',
    success: '#2E8B57',
    warning: '#C98A2E',
    error: '#C0392B',
    errorBg: 'rgba(192,57,43,0.08)',
    fontDisplay: "'Cormorant Garamond', serif",
    fontBody: "'DM Sans', sans-serif",
  }
};
window.activeTheme = window.THEMES.dark;

window.getTheme = function() {
  return window.activeTheme || window.THEMES.dark;
};

window.setTheme = function(name) {
  if (window.THEMES[name]) {
    window.activeTheme = window.THEMES[name];
    return true;
  }
  return false;
};

// ─── ABME Error Catalog ────────────────────────────────────────────
window.ERRORS = {
  DB_OPEN_FAIL:    { code: 'ATH-DB-001', msg: 'I\'m having trouble accessing your saved data. Try closing other browser tabs and coming back.' },
  DB_READ_FAIL:    { code: 'ATH-DB-002', msg: 'I couldn\'t retrieve your saved information. This is usually temporary — please try again.' },
  DB_WRITE_FAIL:   { code: 'ATH-DB-003', msg: 'I wasn\'t able to save your work just now. Please make sure your device isn\'t low on storage and try again.' },
  DB_DELETE_FAIL:   { code: 'ATH-DB-004', msg: 'I ran into a problem removing that data. Please try again in a moment.' },
  SCAN_NO_CAMERA:  { code: 'ATH-SCN-001', msg: 'I can\'t access the camera on this device. Please check your browser permissions and try again.' },
  SCAN_CANCELLED:  { code: 'ATH-SCN-002', msg: 'Scan cancelled. No worries — you can try again whenever you\'re ready.' },
  SCAN_READ_FAIL:  { code: 'ATH-SCN-003', msg: 'I couldn\'t read that image. Please try taking the photo again with good lighting.' },
  OCR_NET_FAIL:    { code: 'ATH-OCR-001', msg: 'I can\'t reach the scanning service right now. Please check your internet connection and try again.' },
  OCR_PARSE_FAIL:  { code: 'ATH-OCR-002', msg: 'I had trouble reading the text in that image. Try a clearer photo with the text fully visible.' },
  OCR_EMPTY:       { code: 'ATH-OCR-003', msg: 'I didn\'t find any text in that image. Make sure the document is clearly visible and well-lit, then try again.' },
  PROFILE_MISSING: { code: 'ATH-PRF-001', msg: 'No profile is selected. Please choose or create a profile to continue.' },
  PROFILE_DUP:     { code: 'ATH-PRF-002', msg: 'A profile with that name already exists. Please choose a different name.' },
  PSI_BUILD_FAIL:  { code: 'ATH-PSI-001', msg: 'I couldn\'t organize your responses into a PSI draft. Please review your answers and try again.' },
  PSI_EXPORT_FAIL: { code: 'ATH-PSI-002', msg: 'I wasn\'t able to export your PSI data. Please try the export again.' },
  VALIDATE_REQUIRED: { code: 'ATH-VAL-001', msg: 'This field needs a response before we can continue.' },
  VALIDATE_LENGTH: { code: 'ATH-VAL-002', msg: 'That response is a bit too long. Please shorten it and try again.' },
  UNKNOWN:         { code: 'ATH-UNK-000', msg: 'Something unexpected happened. If this keeps occurring, please contact support at techsupport@max-opp.com.' },
};

window.makeError = function(errDef, detail) {
  var msg = errDef ? errDef.msg : window.ERRORS.UNKNOWN.msg;
  var code = errDef ? errDef.code : window.ERRORS.UNKNOWN.code;
  if (detail) msg += ' ' + detail;
  console.error('[' + code + '] ' + msg);
  return { code: code, message: msg };
};

// ─── IndexedDB ─────────────────────────────────────────────────────
window.DB_NAME = 'AthenaDB';
window.DB_VERSION = 2;
window.STORE_INTERVIEW = 'interview';
window.STORE_PSI = 'psi';
window.STORE_PROFILES = 'profiles';
window.STORE_CREDENTIALS = 'credentials';
window.STORE_SETTINGS = 'settings';

window.openDB = function() {
  return new Promise(function(resolve, reject) {
    try {
      var req = indexedDB.open(window.DB_NAME, window.DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(window.STORE_INTERVIEW)) {
          db.createObjectStore(window.STORE_INTERVIEW, { keyPath: 'profileId' });
        }
        if (!db.objectStoreNames.contains(window.STORE_PSI)) {
          db.createObjectStore(window.STORE_PSI, { keyPath: 'profileId' });
        }
        if (!db.objectStoreNames.contains(window.STORE_PROFILES)) {
          db.createObjectStore(window.STORE_PROFILES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(window.STORE_CREDENTIALS)) {
          db.createObjectStore(window.STORE_CREDENTIALS, { keyPath: 'profileId' });
        }
        if (!db.objectStoreNames.contains(window.STORE_SETTINGS)) {
          db.createObjectStore(window.STORE_SETTINGS, { keyPath: 'key' });
        }
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function(e) {
        reject(window.makeError(window.ERRORS.DB_OPEN_FAIL, e.target.error));
      };
    } catch (err) {
      reject(window.makeError(window.ERRORS.DB_OPEN_FAIL, String(err)));
    }
  });
};

window.dbGet = function(storeName, key) {
  return window.openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      try {
        var tx = db.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);
        var req = store.get(key);
        req.onsuccess = function() { resolve(req.result || null); };
        req.onerror = function(e) {
          reject(window.makeError(window.ERRORS.DB_READ_FAIL, e.target.error));
        };
      } catch (err) {
        reject(window.makeError(window.ERRORS.DB_READ_FAIL, String(err)));
      }
    });
  });
};

window.dbPut = function(storeName, value) {
  return window.openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      try {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var req = store.put(value);
        req.onsuccess = function() { resolve(true); };
        req.onerror = function(e) {
          reject(window.makeError(window.ERRORS.DB_WRITE_FAIL, e.target.error));
        };
      } catch (err) {
        reject(window.makeError(window.ERRORS.DB_WRITE_FAIL, String(err)));
      }
    });
  });
};

window.dbDelete = function(storeName, key) {
  return window.openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      try {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var req = store.delete(key);
        req.onsuccess = function() { resolve(true); };
        req.onerror = function(e) {
          reject(window.makeError(window.ERRORS.DB_DELETE_FAIL, e.target.error));
        };
      } catch (err) {
        reject(window.makeError(window.ERRORS.DB_DELETE_FAIL, String(err)));
      }
    });
  });
};

window.dbGetAll = function(storeName) {
  return window.openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      try {
        var tx = db.transaction(storeName, 'readonly');
        var store = tx.objectStore(storeName);
        var req = store.getAll();
        req.onsuccess = function() { resolve(req.result || []); };
        req.onerror = function(e) {
          reject(window.makeError(window.ERRORS.DB_READ_FAIL, e.target.error));
        };
      } catch (err) {
        reject(window.makeError(window.ERRORS.DB_READ_FAIL, String(err)));
      }
    });
  });
};

// ─── Profile Management ────────────────────────────────────────────
window.generateId = function() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
};

window.createProfile = function(name) {
  if (!name || !name.trim()) {
    return Promise.reject(window.makeError(window.ERRORS.VALIDATE_REQUIRED, '(profile name)'));
  }
  var profile = {
    id: window.generateId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interviewComplete: false,
    credentialsComplete: false,
    verificationStatus: 'unverified', // unverified | pending | verified
  };
  return window.dbPut(window.STORE_PROFILES, profile).then(function() {
    return profile;
  });
};

window.getActiveProfileId = function() {
  return window.dbGet(window.STORE_SETTINGS, 'activeProfileId').then(function(rec) {
    return rec ? rec.value : null;
  });
};

window.setActiveProfileId = function(profileId) {
  return window.dbPut(window.STORE_SETTINGS, { key: 'activeProfileId', value: profileId });
};

window.getAllProfiles = function() {
  return window.dbGetAll(window.STORE_PROFILES);
};

// ─── Scan / OCR ────────────────────────────────────────────────────
window.pickImage = function() {
  return new Promise(function(resolve, reject) {
    try {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = function(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) { reject(window.makeError(window.ERRORS.SCAN_CANCELLED)); return; }
        var reader = new FileReader();
        reader.onload = function(ev) { resolve(ev.target.result); };
        reader.onerror = function() { reject(window.makeError(window.ERRORS.SCAN_READ_FAIL)); };
        reader.readAsDataURL(file);
      };
      input.click();
    } catch (err) {
      reject(window.makeError(window.ERRORS.SCAN_NO_CAMERA, String(err)));
    }
  });
};

window.DOCUMENT_SCAN_PROMPT = 'Extract ALL text from this document image. Preserve the structure: headings, lists, paragraphs, tables. Return only the extracted text, no commentary.';

window.callOcr = function(base64DataUrl) {
  var base64 = base64DataUrl.split(',')[1];
  var mediaType = 'image/jpeg';
  var match = base64DataUrl.match(/^data:(image\/\w+);/);
  if (match) mediaType = match[1];

  return fetch(window.API_BASE + '/v1/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      mediaType: mediaType,
      prompt: window.DOCUMENT_SCAN_PROMPT,
    }),
  })
  .then(function(res) {
    if (!res.ok) throw new Error('OCR HTTP ' + res.status);
    return res.json();
  })
  .then(function(data) {
    return window.parseOcrResponse(data);
  })
  .catch(function(err) {
    throw window.makeError(window.ERRORS.OCR_NET_FAIL, String(err));
  });
};

window.parseOcrResponse = function(data) {
  if (!data) throw window.makeError(window.ERRORS.OCR_PARSE_FAIL);
  // Handle various response shapes from the Worker
  var text = '';
  if (typeof data === 'string') {
    text = data;
  } else if (data.text) {
    text = data.text;
  } else if (data.content && Array.isArray(data.content)) {
    text = data.content
      .filter(function(b) { return b.type === 'text'; })
      .map(function(b) { return b.text; })
      .join('\n');
  } else if (data.result) {
    text = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
  }
  text = text.trim();
  if (!text) throw window.makeError(window.ERRORS.OCR_EMPTY);
  return text;
};

// ─── Validation Helpers ────────────────────────────────────────────
window.validateRequired = function(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

window.validateMaxLength = function(val, max) {
  if (typeof val !== 'string') return true;
  return val.length <= max;
};

window.sanitizeText = function(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/<[^>]*>/g, '').trim();
};

// ─── PSI Builder ───────────────────────────────────────────────────
window.buildTier1Psi = function(answers, profileId) {
  if (!answers || !profileId) {
    throw window.makeError(window.ERRORS.PSI_BUILD_FAIL, 'Missing answers or profileId');
  }
  var situations = answers.situations;
  if (!Array.isArray(situations) || situations.length === 0) {
    throw window.makeError(window.ERRORS.PSI_BUILD_FAIL, 'No situations provided');
  }
  var problems = situations.map(function(sit, i) {
    return {
      id: 'prob_' + (i + 1),
      label: window.sanitizeText(sit),
      severity: 'moderate',
      tags: [],
      detectionRules: [],
      tier: 1,
    };
  });
  return {
    profileId: profileId,
    version: '1.0.0',
    schemaVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sme: {
      name: window.sanitizeText(answers.name || ''),
      practice: window.sanitizeText(answers.practice || ''),
      role: window.sanitizeText(answers.whatYouDo || ''),
      domain: window.sanitizeText(answers.domain || ''),
      audience: window.sanitizeText(answers.audience || ''),
      frequency: window.sanitizeText(answers.frequency || ''),
      notes: window.sanitizeText(answers.notes || ''),
    },
    problems: problems,
    solutions: [],
    mappings: [],
  };
};

// ─── Self-Verification ────────────────────────────────────────────
window.selfVerify = function() {
  var checks = [];
  // Check critical globals
  var required = ['ATHENA_VERSION','API_BASE','THEMES','ERRORS','openDB','buildTier1Psi',
    'INTERVIEW_SCREENS','createProfile','getActiveProfileId'];
  required.forEach(function(name) {
    checks.push({ name: name, ok: typeof window[name] !== 'undefined' });
  });
  // Check IndexedDB
  checks.push({ name: 'indexedDB', ok: typeof indexedDB !== 'undefined' });
  var failures = checks.filter(function(c) { return !c.ok; });
  if (failures.length > 0) {
    console.warn('[Athena Self-Verify] FAILURES:', failures.map(function(f) { return f.name; }));
  } else {
    console.log('[Athena Self-Verify] All checks passed (' + checks.length + ')');
  }
  return { checks: checks, failures: failures, ok: failures.length === 0 };
};

// ─── Toast Notification ────────────────────────────────────────────
window.showToast = function(message, type) {
  type = type || 'info';
  var colors = {
    error: { bg: '#CF6679', text: '#FFFFFF' },
    warning: { bg: '#E5A63E', text: '#1A1A2E' },
    success: { bg: '#4CAF82', text: '#FFFFFF' },
    info: { bg: '#C9A84C', text: '#0D1024' },
  };
  var durations = { error: 8000, warning: 7000, success: 3000, info: 4000 };
  var c = colors[type] || colors.info;
  var dur = durations[type] || 4000;
  var toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);' +
    'background:' + c.bg + ';color:' + c.text + ';padding:0.85rem 1.5rem;border-radius:8px;' +
    'font-size:1rem;font-family:"DM Sans",sans-serif;z-index:9999;max-width:85vw;text-align:center;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.3s;cursor:pointer;';
  toast.addEventListener('click', function() {
    toast.style.opacity = '0';
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
  });
  document.body.appendChild(toast);
  requestAnimationFrame(function() { toast.style.opacity = '1'; });
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }, dur);
};

// ─── Legacy Compatibility (used by tier2-view.js) ──────────────────
window.TIER2_KEY = 'tier2Progress';

window.loadData = function(key, defaultVal) {
  return window.dbGet(window.STORE_SETTINGS, key)
    .then(function(rec) {
      return (rec && rec.value !== undefined) ? rec.value : (defaultVal || null);
    })
    .catch(function(err) {
      console.warn('[loadData] Failed for key=' + key, err);
      return defaultVal || null;
    });
};

window.saveWithRetry = function(key, value, retries) {
  retries = retries || 3;
  return window.dbPut(window.STORE_SETTINGS, { key: key, value: value })
    .catch(function(err) {
      if (retries > 1) {
        console.warn('[saveWithRetry] Retry for key=' + key, err);
        return new Promise(function(resolve) { setTimeout(resolve, 300); })
          .then(function() { return window.saveWithRetry(key, value, retries - 1); });
      }
      throw err;
    });
};

// ─── Platform Credentials — ABME multi-role system ──────────────
window.PLATFORM_CREDENTIALS = [
  { role: 'admin', label: 'ABME Administrator', hash: 'd572f0764eada333713cd1d12490958d179605e55936c19ac6f59760ae66d193' },
];

window.checkCredential = async function(password) {
  try {
    var encoder = new TextEncoder();
    var data = encoder.encode(password);
    var hashBuffer = await crypto.subtle.digest('SHA-256', data);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    var hashHex = hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    for (var i = 0; i < window.PLATFORM_CREDENTIALS.length; i++) {
      if (hashHex === window.PLATFORM_CREDENTIALS[i].hash) return window.PLATFORM_CREDENTIALS[i];
    }
    return null;
  } catch (err) {
    console.error('[checkCredential] Hash computation failed:', err);
    return null;
  }
};

window.checkAdminPassword = async function(password) {
  try {
    return (await window.checkCredential(password)) !== null;
  } catch (err) {
    console.error('[checkAdminPassword] Verification failed:', err);
    return false;
  }
};

// ─── Interview Config (admin-editable overrides) ────────────────
window.INTERVIEW_CONFIG_KEY = 'interviewConfig';

window.loadInterviewConfig = function() {
  return window.dbGet(window.STORE_SETTINGS, window.INTERVIEW_CONFIG_KEY)
    .then(function(rec) {
      return (rec && rec.value) ? rec.value : null;
    })
    .catch(function(err) {
      console.warn('[loadInterviewConfig] Failed:', err);
      return null;
    });
};

window.saveInterviewConfig = function(config) {
  return window.dbPut(window.STORE_SETTINGS, {
    key: window.INTERVIEW_CONFIG_KEY,
    value: config,
  }).catch(function(err) {
    console.error('[saveInterviewConfig] Save failed:', err);
    throw window.makeError(window.ERRORS.DB_WRITE_FAIL, 'Interview configuration could not be saved. Error: ' + (err.message || String(err)));
  });
};

// Merge admin overrides onto default interview screens at runtime
window.getInterviewScreens = function(config) {
  try {
    var screens = JSON.parse(JSON.stringify(window.INTERVIEW_SCREENS));
    if (!config || typeof config !== 'object') return screens;
    var overrides = config.screens || {};
    screens.forEach(function(scr) {
      var ov = overrides[scr.id];
      if (!ov || typeof ov !== 'object') return;
      if (ov.title && typeof ov.title === 'string')       scr.title = ov.title;
      if (ov.subtitle && typeof ov.subtitle === 'string') scr.subtitle = ov.subtitle;
      if (ov.placeholder && typeof ov.placeholder === 'string') scr.placeholder = ov.placeholder;
      if (ov.body && typeof ov.body === 'string')          scr.body = ov.body;
      if (ov.addLabel && typeof ov.addLabel === 'string')  scr.addLabel = ov.addLabel;
      if (ov.hint && typeof ov.hint === 'string')          scr.hint = ov.hint;
    });
    return screens;
  } catch (err) {
    console.error('[getInterviewScreens] Override merge failed, using defaults:', err);
    return JSON.parse(JSON.stringify(window.INTERVIEW_SCREENS));
  }
};

// ─── Tier 2 Drilldown Text Defaults ─────────────────────────────
// {situation} is replaced at render time with the situation label
window.TIER2_TEXT_DEFAULTS = {
  advice: {
    title: 'When someone needs to {situation}, what\u2019s the most important advice you can offer them?',
    subtitle: 'Say it the way you\u2019d say it to them directly. Later you\u2019ll have a chance to add other advice too.',
    placeholder: 'The most important thing I\u2019d tell them is\u2026',
  },
  worse: {
    title: 'When someone needs to {situation}, what makes it worse?',
    subtitle: 'What should they avoid doing? What common mistakes do people make? This helps the app know what NOT to recommend.',
    placeholder: 'What makes it worse or what should they avoid\u2026',
  },
  resources: {
    title: 'For someone who needs to {situation}, is there a resource you\u2019d point them to?',
    subtitle: 'A video, a website, a printed handout, a PDF \u2014 anything they could reference. You can also scan a printed document.',
  },
  escalation: {
    title: 'When someone needs to {situation}, when should they contact you instead of handling it themselves?',
    subtitle: 'Describe the point where self-help isn\u2019t enough and they need you directly. This sets the boundary between what the app handles and what requires a professional.',
    placeholder: 'They should contact me when\u2026',
    severityLabel: 'How serious is this situation typically?',
  },
  more: {
    title: 'Any other advice for someone who needs to {situation}?',
    subtitle: 'You\u2019ve already shared your most important advice. Add any other solutions, techniques, or suggestions they might try. These will be offered if the first advice isn\u2019t enough.',
    placeholder: 'Another thing I\u2019d suggest is\u2026',
  },
};

// Get Tier 2 text with admin overrides applied, {situation} NOT yet replaced
window.getTier2Text = function(config) {
  try {
    var defaults = JSON.parse(JSON.stringify(window.TIER2_TEXT_DEFAULTS));
    if (!config || typeof config !== 'object' || !config.tier2) return defaults;
    var ov = config.tier2;
    Object.keys(defaults).forEach(function(screenId) {
      if (!ov[screenId] || typeof ov[screenId] !== 'object') return;
      Object.keys(ov[screenId]).forEach(function(field) {
        if (typeof ov[screenId][field] === 'string' && ov[screenId][field].trim()) {
          defaults[screenId][field] = ov[screenId][field];
        }
      });
    });
    return defaults;
  } catch (err) {
    console.error('[getTier2Text] Override merge failed, using defaults:', err);
    return JSON.parse(JSON.stringify(window.TIER2_TEXT_DEFAULTS));
  }
};

// Replace {situation} placeholder in a text string
window.fillSituation = function(text, sitLabel) {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(/\{situation\}/g, sitLabel || 'this situation');
};

// ─── Privacy / About Text ───────────────────────────────────────
window.ABOUT_PRIVACY_TEXT = 'All interview data is stored on this device until you specifically submit your Problem Solution Index (PSI). Then, and only then, your responses are uploaded to the A Better Me (ABMe) platform for reference by other ABMe applications. You may adjust or remove your responses at any time as long as this app is installed and active. This app does NOT report any other data about you or your device.';

// ─── Grammar / Spelling Scan ────────────────────────────────────
window.callGrammarScan = function(answers) {
  try {
    // Build the payload: each field with its label and value
    var fields = [];
    window.INTERVIEW_SCREENS.forEach(function(scr) {
      if (!scr.psiField) return;
      var val = answers[scr.id];
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach(function(item, i) {
          if (item && item.trim()) {
            fields.push({ id: scr.id + '_' + i, label: scr.title + ' #' + (i + 1), text: item.trim() });
          }
        });
      } else if (typeof val === 'string' && val.trim()) {
        fields.push({ id: scr.id, label: scr.title, text: val.trim() });
      }
    });
    if (fields.length === 0) {
      return Promise.resolve([]);
    }

    var prompt = 'You are a grammar and spelling checker for a professional interview form. ' +
      'Review the following fields and suggest corrections for grammar, spelling, punctuation, and clarity. ' +
      'CAPITALIZATION RULES FOR MEDICAL TERMS: Most medical conditions are common nouns and should be lowercase ' +
      '(e.g., sciatica, diabetes, arthritis, tendinitis). Only capitalize medical terms derived from proper nouns ' +
      '(e.g., Parkinson\\u2019s disease, Alzheimer\\u2019s disease, Crohn\\u2019s disease). If you are unsure whether ' +
      'a medical term should be capitalized, leave it exactly as the user wrote it. ' +
      'Return ONLY a JSON array (no markdown, no backticks, no commentary). Each item should have: ' +
      '{"id": "fieldId", "original": "original text", "corrected": "corrected text", "reason": "brief explanation"}. ' +
      'Only include items that need changes. If nothing needs correction, return an empty array []. ' +
      'Here are the fields to review:\n\n' +
      JSON.stringify(fields, null, 2);

    return fetch(window.API_BASE + '/v1/help-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Grammar scan HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      try {
        // Extract text from response (may be wrapped in content array or be plain text)
        var text = '';
        if (typeof data === 'string') {
          text = data;
        } else if (data.text) {
          text = data.text;
        } else if (data.content && Array.isArray(data.content)) {
          text = data.content
            .filter(function(b) { return b.type === 'text'; })
            .map(function(b) { return b.text; })
            .join('\n');
        } else if (data.response) {
          text = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
        }
        // Strip any markdown code fences
        text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        var parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          console.warn('[callGrammarScan] Response was not an array, wrapping:', parsed);
          return [];
        }
        // Validate each suggestion has required fields
        var valid = parsed.filter(function(item) {
          return item && item.id && item.original && item.corrected && item.corrected !== item.original;
        });
        // Enrich with human-readable labels from the original fields
        var labelMap = {};
        fields.forEach(function(f) { labelMap[f.id] = f.label; });
        valid.forEach(function(item) {
          if (!item.label && labelMap[item.id]) {
            item.label = labelMap[item.id];
          }
        });
        return valid;
      } catch (parseErr) {
        console.error('[callGrammarScan] Response parse failed:', parseErr, 'Raw:', data);
        return [];
      }
    })
    .catch(function(err) {
      console.error('[callGrammarScan] API call failed:', err);
      // Return empty array so the flow can continue — grammar scan is non-blocking
      return [];
    });
  } catch (err) {
    console.error('[callGrammarScan] Setup failed:', err);
    return Promise.resolve([]);
  }
};

console.log('Athena shared.js v' + window.ATHENA_VERSION + ' loaded');
