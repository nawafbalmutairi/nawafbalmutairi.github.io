// SINGLE SOURCE OF TRUTH — identity, destinations, contact.
// Every value here was read out of the repository before the redesign began.
// Sources are cited per field. Nothing on this site is invented; where a fact
// does not exist in the repo it is marked TODO(content) and rendered as absent
// rather than filled in.

export const profile = {
  name: 'Nawaf Almutairi',
  discipline: 'AI × Data × Engineering',

  // src(pre-redesign index.html #hero): "I build the system behind the numbers."
  statement: 'I build the system behind the numbers.',

  // src(pre-redesign index.html #statement)
  intent:
    'A dashboard is a decision tool, not wallpaper. Every project here is ' +
    'structured the same way: read the problem, design the system, then ' +
    'measure what changed.',

  // src(pre-redesign index.html #hero)
  bio: [
    'BSc Computer Science graduate of Northumbria University, based in Riyadh. ' +
    'I work at the intersection of data analysis, business intelligence and ' +
    'machine learning, with methodology at the centre of everything I build.',

    'I think a lot about AI as a productivity tool, but I think more about the ' +
    'person holding it. The model is impressive; the operator decides whether ' +
    'the output is worth anything. Knowing what to ask, what to trust, and what ' +
    'to throw away is the actual job.',
  ],

  // src(pre-redesign index.html #hero)
  availability: 'Open · August 2026 graduate roles',
  location: 'Riyadh, KSA · UTC+3',
  affiliation: 'Member of the Claude Builder Club by Anthropic',
};

// src(pre-redesign index.html #contact). The CV is the one link the brief asks
// for that has no source in any repo — see TODO below; it is omitted, not faked.
export const contact = [
  { id: 'github',   label: 'GitHub',   href: 'https://github.com/nawafbalmutairi', hint: 'github.com/nawafbalmutairi' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/nawaf-almutairi-907766290/', hint: 'linkedin.com/in/nawafbalmutairi' },
  { id: 'email',    label: 'Email',    href: 'mailto:NawafBAlmutairi@outlook.sa', hint: 'NawafBAlmutairi@outlook.sa' },
  { id: 'phone',    label: 'Phone',    href: 'tel:+966501649447', hint: '+966 50 164 9447' },
  // TODO(content): CV — no CV or résumé file exists in any of the four repos.
  // Supply a PDF and it becomes a fifth dock link with no other change.
];

// The five destinations from the brief. These are places in the environment,
// not links down a page: choosing one moves the room.
export const destinations = [
  { id: 'identity', index: '01', label: 'Identity' },
  { id: 'work',     index: '02', label: 'Work' },
  { id: 'stack',    index: '03', label: 'Stack' },
  { id: 'journey',  index: '04', label: 'Journey' },
  { id: 'contact',  index: '05', label: 'Contact' },
];
