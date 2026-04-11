/**
 * Athena — The Configurator
 * tour-view.js — Opening Tour (onboarding walkthrough)
 * Version: 0.3.3.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

// ─── Tour Slide Content (placeholder — replace with final copy) ──────────

window.TOUR_SLIDES = [
  {
    id: 'welcome',
    icon: '\uD83E\uDDA9',  // owl
    title: 'Welcome to Athena',
    body: 'Athena captures your professional expertise and transforms it into structured guidance that helps real people make better decisions.\n\nThis short tour explains how the process works and how your data is protected.',
    cta: 'Let\u2019s Get Started'
  },
  {
    id: 'how-it-works',
    icon: '\uD83D\uDCCB',  // clipboard
    title: 'How the Interview Works',
    body: 'Athena walks you through a guided interview about your area of expertise.\n\nFirst, you\u2019ll identify key situations. Then, for each situation, you\u2019ll share your best advice, what makes things worse, helpful resources, and when to escalate.\n\nYour answers form a Problem/Solution Index (PSI) \u2014 a structured knowledge graph.',
    cta: 'Next'
  },
  {
    id: 'data-on-device',
    icon: '\uD83D\uDCF1',  // phone
    title: 'Your Data Stays on This Device',
    body: 'During the interview, all of your responses are stored locally on this device using secure browser storage.\n\nNothing is transmitted anywhere until you explicitly choose to share it. You are always in control.',
    cta: 'Next'
  },
  {
    id: 'upload-choice',
    icon: '\u2601\uFE0F',  // cloud
    title: 'Sharing Is Your Choice',
    body: 'At the end of the interview, you\u2019ll have the option to upload your PSI to the ABMe platform.\n\nThis makes your expertise available to people who need it \u2014 through apps like Hermes and Aha Magic that deliver personalized guidance.\n\nYou can always decline, and your data remains on this device only.',
    cta: 'Next'
  },
  {
    id: 'security',
    icon: '\uD83D\uDD12',  // lock
    title: 'Enterprise-Grade Security',
    body: 'If you choose to upload, your data is transmitted over encrypted HTTPS and stored on the Cloudflare global network \u2014 the same infrastructure trusted by Fortune 500 companies, governments, and major healthcare organizations.\n\nYour professional knowledge is never shared with advertisers or sold to third parties. It is used solely to help people make better decisions in the areas you know best.',
    cta: 'Next'
  },
  {
    id: 'edit-anytime',
    icon: '\u270F\uFE0F',  // pencil
    title: 'Edit or Remove Anytime',
    body: 'You can update, revise, or completely remove your uploaded expertise at any time, as long as this app is installed and active.\n\nYour knowledge, your rules.',
    cta: 'Next'
  },
  {
    id: 'ready',
    icon: '\uD83D\uDE80',  // rocket
    title: 'Ready to Share Your Expertise?',
    body: 'That\u2019s the overview. Now let\u2019s set up your profile and begin the interview.\n\nThank you for contributing your knowledge to help others.',
    cta: 'Begin'
  }
];

// ─── Condensed Recap Slides (shown at upload decision point) ─────────────

window.TOUR_RECAP_SLIDES = [
  {
    id: 'recap-security',
    icon: '\uD83D\uDD12',
    title: 'Your Data Is Secure',
    body: 'Your PSI is transmitted over encrypted HTTPS and stored on the Cloudflare global network \u2014 enterprise-grade security trusted worldwide.\n\nNo advertisers. No data sales. Your expertise helps real people, period.'
  },
  {
    id: 'recap-control',
    icon: '\u270F\uFE0F',
    title: 'You Stay in Control',
    body: 'You can edit or remove your uploaded expertise at any time. Nothing is permanent unless you want it to be.'
  },
  {
    id: 'recap-impact',
    icon: '\uD83C\uDF1F',  // star
    title: 'Your Expertise Helps People',
    body: 'When you upload, your knowledge becomes available through ABMe applications that deliver personalized, expert-backed guidance to people who need it most.\n\nYou\u2019re not just answering questions \u2014 you\u2019re building something that helps.'
  }
];

// ─── Tour View Component ─────────────────────────────────────────────────

window.TourView = function TourView(props) {
  var onComplete = props.onComplete;
  var t = window.getTheme();
  var useState = React.useState;

  var [slide, setSlide] = useState(0);
  var slides = window.TOUR_SLIDES;
  var current = slides[slide];

  var containerStyle = {
    minHeight: '100vh',
    background: t.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1.5rem',
    fontFamily: t.fontBody,
    color: t.text
  };

  var cardStyle = {
    background: t.bgCard,
    border: '1px solid ' + t.border,
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center'
  };

  var iconStyle = {
    fontSize: '3rem',
    marginBottom: '1rem'
  };

  var titleStyle = {
    fontFamily: t.fontDisplay,
    fontSize: '1.6rem',
    color: t.accent,
    marginBottom: '1rem',
    fontWeight: 600
  };

  var bodyStyle = {
    fontSize: '1rem',
    lineHeight: '1.65',
    color: t.textSecondary,
    whiteSpace: 'pre-line',
    marginBottom: '2rem'
  };

  var btnStyle = {
    background: t.accent,
    color: t.bg,
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem 2.5rem',
    fontSize: '1.05rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: t.fontBody
  };

  var dotContainerStyle = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '1.5rem'
  };

  var skipStyle = {
    background: 'transparent',
    border: 'none',
    color: t.textMuted,
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginTop: '1rem',
    fontFamily: t.fontBody
  };

  function advance() {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      onComplete();
    }
  }

  return React.createElement('div', { style: containerStyle },
    React.createElement('div', { style: cardStyle },
      React.createElement('div', { style: iconStyle }, current.icon),
      React.createElement('h1', { style: titleStyle }, current.title),
      React.createElement('p', { style: bodyStyle }, current.body),
      React.createElement('button', { style: btnStyle, onClick: advance }, current.cta || 'Next'),
      React.createElement('div', { style: dotContainerStyle },
        slides.map(function(s, i) {
          return React.createElement('span', {
            key: s.id,
            style: {
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: i === slide ? t.accent : t.border,
              transition: 'background 0.3s'
            }
          });
        })
      ),
      slide > 0 && React.createElement('button', {
        style: skipStyle,
        onClick: onComplete
      }, 'Skip tour')
    )
  );
};
