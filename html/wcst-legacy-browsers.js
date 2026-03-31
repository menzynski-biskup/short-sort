/**
 * WCST-64 for Pavlovia
 * Wisconsin Card Sorting Test – 64-card version
 *
 * Reads from URL: ?participant_id=X&group=Y&session=Z&time_of_day=W
 *
 * Sorting-principle sets (6 total, 10 consecutive correct each):
 *   1. Colour  2. Shape  3. Number  4. Colour  5. Shape  6. Number
 *
 * Reference cards (fixed top row):
 *   pos 1: 1 red triangle   pos 2: 2 green stars
 *   pos 3: 3 yellow crosses  pos 4: 4 blue circles (dots)
 *
 * Built with PsychoJS 2022.2.4
 */



const { PsychoJS } = core;
const { TrialHandler } = data;
const { Scheduler } = util;

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const COLORS   = ['red', 'green', 'yellow', 'blue'];
const SHAPES   = ['triangle', 'star', 'cross', 'dot'];
const NUMBERS  = [1, 2, 3, 4];

// 6 sets, each requires CORRECT_PER_SET consecutive correct answers
const PRINCIPLES     = ['colour', 'shape', 'number', 'colour', 'shape', 'number'];
const CORRECT_PER_SET = 10;

// The 4 fixed reference cards (top row).
// Crucially: for each attribute, position index matches attribute-value index.
//   colour index: red=0, green=1, yellow=2, blue=3  → matches pos 0-3
//   shape  index: triangle=0, star=1, cross=2, dot=3 → matches pos 0-3
//   number index: 1=0, 2=1, 3=2, 4=3               → matches pos 0-3
const REF_CARDS = [
  { number: 1, color: 'red',    shape: 'triangle' }, // pos 0 (displayed as "1")
  { number: 2, color: 'green',  shape: 'star'     }, // pos 1 (displayed as "2")
  { number: 3, color: 'yellow', shape: 'cross'    }, // pos 2 (displayed as "3")
  { number: 4, color: 'blue',   shape: 'dot'      }, // pos 3 (displayed as "4")
];

/**
 * Pre-computed stimulus deck (64 cards).
 *
 * Constraint: no two consecutive cards share colour, shape, OR number.
 * This prevents accidental correct-response runs regardless of active principle.
 *
 * Generated with Warnsdorff's heuristic (verified: every consecutive pair
 * differs in all three attributes).
 */
const DECK = [
  {number:2,color:'blue',   shape:'star'},
  {number:1,color:'red',    shape:'triangle'},
  {number:3,color:'green',  shape:'cross'},
  {number:4,color:'yellow', shape:'dot'},
  {number:1,color:'red',    shape:'star'},
  {number:2,color:'green',  shape:'cross'},
  {number:3,color:'yellow', shape:'dot'},
  {number:1,color:'blue',   shape:'triangle'},
  {number:4,color:'green',  shape:'cross'},
  {number:1,color:'blue',   shape:'star'},
  {number:2,color:'yellow', shape:'dot'},
  {number:3,color:'red',    shape:'triangle'},
  {number:4,color:'green',  shape:'dot'},
  {number:2,color:'red',    shape:'triangle'},
  {number:3,color:'yellow', shape:'cross'},
  {number:4,color:'blue',   shape:'star'},
  {number:1,color:'green',  shape:'cross'},
  {number:2,color:'red',    shape:'star'},
  {number:3,color:'yellow', shape:'triangle'},
  {number:4,color:'blue',   shape:'dot'},
  {number:1,color:'red',    shape:'cross'},
  {number:2,color:'green',  shape:'star'},
  {number:3,color:'blue',   shape:'triangle'},
  {number:1,color:'yellow', shape:'dot'},
  {number:4,color:'green',  shape:'star'},
  {number:2,color:'red',    shape:'cross'},
  {number:4,color:'blue',   shape:'triangle'},
  {number:3,color:'red',    shape:'cross'},
  {number:1,color:'green',  shape:'star'},
  {number:2,color:'blue',   shape:'triangle'},
  {number:1,color:'red',    shape:'dot'},
  {number:2,color:'yellow', shape:'triangle'},
  {number:1,color:'green',  shape:'dot'},
  {number:2,color:'yellow', shape:'star'},
  {number:3,color:'blue',   shape:'cross'},
  {number:4,color:'red',    shape:'dot'},
  {number:2,color:'yellow', shape:'cross'},
  {number:3,color:'blue',   shape:'star'},
  {number:4,color:'red',    shape:'triangle'},
  {number:1,color:'blue',   shape:'dot'},
  {number:3,color:'green',  shape:'star'},
  {number:4,color:'yellow', shape:'triangle'},
  {number:3,color:'green',  shape:'dot'},
  {number:4,color:'red',    shape:'cross'},
  {number:1,color:'yellow', shape:'triangle'},
  {number:3,color:'blue',   shape:'dot'},
  {number:4,color:'red',    shape:'star'},
  {number:1,color:'yellow', shape:'cross'},
  {number:2,color:'green',  shape:'dot'},
  {number:4,color:'yellow', shape:'cross'},
  {number:2,color:'green',  shape:'triangle'},
  {number:3,color:'red',    shape:'star'},
  {number:1,color:'blue',   shape:'cross'},
  {number:3,color:'red',    shape:'dot'},
  {number:4,color:'green',  shape:'triangle'},
  {number:1,color:'yellow', shape:'star'},
  {number:2,color:'blue',   shape:'cross'},
  {number:3,color:'green',  shape:'triangle'},
  {number:2,color:'blue',   shape:'dot'},
  {number:4,color:'yellow', shape:'star'},
  {number:1,color:'green',  shape:'triangle'},
  {number:2,color:'red',    shape:'dot'},
  {number:3,color:'yellow', shape:'star'},
  {number:4,color:'blue',   shape:'cross'},
];

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Returns the relative path to the image file for a card.
 * Naming convention in /resources/:
 *   {number}{Color}{Shape}.jpg   (singular, n=1)
 *   {number}{Color}{Shapes}.jpg  (plural,  n>1)
 */
function cardImage(n, c, s) {
  const shapeNames = {
    triangle: n === 1 ? 'Triangle' : 'Triangles',
    star:     n === 1 ? 'Star'     : 'Stars',
    cross:    n === 1 ? 'Cross'    : 'Crosses',
    dot:      n === 1 ? 'Dot'      : 'Dots',
  };
  return `resources/${n}${c}${shapeNames[s]}.jpg`;
}

/**
 * Returns the index (0-3) of the correct reference card for the
 * given stimulus card and sorting principle.
 */
function getCorrectRefIdx(card, principle) {
  if (principle === 'colour') return COLORS.indexOf(card.color);
  if (principle === 'shape')  return SHAPES.indexOf(card.shape);
  return NUMBERS.indexOf(card.number); // 'number'
}

/**
 * Returns an array of the sorting principle(s) the participant
 * appeared to use when clicking reference card at clickedIdx.
 *
 * Ambiguous responses (where the stimulus card matches the clicked
 * reference card on more than one attribute) return multiple entries.
 * The response is scored as correct if the current active principle
 * is among the returned principles.
 */
function getUsedPrinciples(stim, clickedIdx) {
  const ref  = REF_CARDS[clickedIdx];
  const used = [];
  if (stim.color  === ref.color)  used.push('colour');
  if (stim.shape  === ref.shape)  used.push('shape');
  if (stim.number === ref.number) used.push('number');
  return used;
}

/**
 * Returns the error type for an incorrect response:
 *   'none'              – response was correct
 *   'perseverative'     – used the rule from the PREVIOUS set
 *   'non-perseverative' – all other errors
 */
function getErrorType(usedPrinciples, currentPrinciple, previousPrinciple) {
  if (usedPrinciples.includes(currentPrinciple))                              return 'none';
  if (previousPrinciple && usedPrinciples.includes(previousPrinciple))       return 'perseverative';
  return 'non-perseverative';
}

// ─────────────────────────────────────────────────────────────
// EXPERIMENT SETUP
// ─────────────────────────────────────────────────────────────

const expName   = 'WCST-64';
const urlParams = new URLSearchParams(window.location.search);

let expInfo = {
  // 'participant' is used by PsychoJS/Pavlovia for the data-file name
  'participant':     urlParams.get('participant_id') || 'unknown',
  'participant_id':  urlParams.get('participant_id') || 'unknown',
  'group':           urlParams.get('group')          || 'unknown',
  'session':         urlParams.get('session')        || '1',
  'time_of_day':     urlParams.get('time_of_day')    || 'unknown',
  'date':            util.MonotonicClock.getDateStr(),
  'expName':         expName,
  'psychopyVersion': '2022.2.4',
  'OS':              window.navigator.platform,
};

// Collect every unique image path needed so PsychoJS can preload them
const _imageSet = new Set();
DECK.forEach(c      => _imageSet.add(cardImage(c.number,   c.color,   c.shape)));
REF_CARDS.forEach(c => _imageSet.add(cardImage(c.number,   c.color,   c.shape)));
const resources = [..._imageSet].map(f => ({ name: f, path: f }));

// ── PsychoJS instance ──────────────────────────────────────
const psychoJS = new PsychoJS({ debug: false });

// ── Dialog (shows participant-info fields, resource-loading bar,
//    "All resources downloaded" status, and OK button — required
//    for Pavlovia to initialise correctly) ───────────────────
psychoJS.schedule(psychoJS.gui.DlgFromDict({
  dictionary: expInfo,
  title: expName,
}));

const flowScheduler        = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);

// Only run the experiment if the participant clicked OK
psychoJS.scheduleCondition(
  function() { return (psychoJS.gui.dialogComponent.button === 'OK'); },
  flowScheduler,
  dialogCancelScheduler,
);

flowScheduler.add(updateInfo);
flowScheduler.add(experimentInit);

// Instructions
flowScheduler.add(instrBegin);
flowScheduler.add(instrEachFrame);
flowScheduler.add(instrEnd);

// 64-trial task loop
const trialLoopScheduler = new Scheduler(psychoJS);
flowScheduler.add(trialLoopBegin(trialLoopScheduler));
flowScheduler.add(trialLoopScheduler);
flowScheduler.add(trialLoopEnd);

// End screen
flowScheduler.add(endBegin);
flowScheduler.add(endEachFrame);
flowScheduler.add(endEnd);

flowScheduler.add(quitPsychoJS);

// If the participant cancels the dialog, quit gracefully
dialogCancelScheduler.add(quitPsychoJS);

// Kick off resource loading and Pavlovia connection
psychoJS.start({ expName: expName, expInfo: expInfo, resources: resources });

try {
  psychoJS.experimentLogger.setLevel(core.Logger.ServerLevel.EXP);
} catch (e) { /* not available in all versions */ }

// ─────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────

// Visual stimuli (created inside experimentInit)
let refImgs     = [];  // 4 reference-card ImageStims
let stimImg;           // stimulus ImageStim
let instrText;         // instruction screen TextStim
let feedbackStim;      // "Correct!" / "Incorrect!" TextStim
let progressText;      // trial/set counter TextStim
let separator;         // thin horizontal bar between ref row and task area
let endText;           // end-screen TextStim
let mouse;             // Mouse object

// Experiment-progress counters
let _currentSet    = 0;     // index into PRINCIPLES (0-5)
let _correctInSet  = 0;     // consecutive correct responses in the current set
let _prevPrinciple = null;  // principle of the LAST completed set
let _done          = false; // true once all 6 sets are completed

// Per-trial state (captured in trialBegin / trialEnd, consumed in feedbackEnd)
let _card;                  // current stimulus card {number, color, shape}
let _clickedIdx;            // index of clicked reference card (0-3)
let _rt;                    // response time (seconds)
let _correct;               // boolean
let _usedPrinciples;        // array of principle strings used by participant
let _errorType;             // 'none' | 'perseverative' | 'non-perseverative'
let _trialPrinciple;        // active principle for THIS trial (before any set update)
let _trialSetNumber;        // set number (1-6) when this trial was presented
let _trialPrevPrinciple;    // previous principle when this trial was presented

// Leading-edge click detection (prevent carry-over clicks between routines)
let _prevMouseDown = false;

// Keyboard shortcut: space advances instructions / end screen
let _spacePressed = false;
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') _spacePressed = true;
});

// Clocks
let _instrClock, _trialClock, _feedbackClock, _endClock;

// ─────────────────────────────────────────────────────────────
// FLOW FUNCTIONS
// ─────────────────────────────────────────────────────────────

async function updateInfo() {
  expInfo['date']            = util.MonotonicClock.getDateStr();
  expInfo['expName']         = expName;
  expInfo['psychopyVersion'] = '2022.2.4';
  expInfo['OS']              = window.navigator.platform;
  return Scheduler.Event.NEXT;
}

async function experimentInit() {
  // ── Window ──────────────────────────────────────────────
  psychoJS.openWindow({
    fullscr:      true,
    color:        new util.Color([-0.1, -0.1, -0.1]), // dark-grey background
    units:        'height',
    waitBlanking: true,
  });

  // ── Mouse ───────────────────────────────────────────────
  mouse = new core.Mouse({ win: psychoJS.window, name: 'mouse', autoLog: false });

  // ── Reference cards (top row, shown throughout the task) ─
  const refXPos  = [-0.40, -0.13, 0.13, 0.40];
  const refCardSize = [0.155, 0.205];
  for (let i = 0; i < 4; i++) {
    const ref = REF_CARDS[i];
    refImgs.push(new visual.ImageStim({
      win:   psychoJS.window,
      name:  `ref_${i}`,
      image: cardImage(ref.number, ref.color, ref.shape),
      pos:   [refXPos[i], 0.315],
      size:  refCardSize,
      units: 'height',
    }));
  }

  // ── Stimulus card (centre of screen) ────────────────────
  stimImg = new visual.ImageStim({
    win:   psychoJS.window,
    name:  'stimulus',
    image: undefined,
    pos:   [0.0, -0.13],
    size:  [0.195, 0.255],
    units: 'height',
  });

  // ── Thin separator between reference row and response area
  separator = new visual.Rect({
    win:       psychoJS.window,
    name:      'separator',
    width:     1.70,
    height:    0.003,
    fillColor: new util.Color([0.3, 0.3, 0.3]),
    lineColor: new util.Color([0.3, 0.3, 0.3]),
    pos:       [0, 0.155],
    units:     'height',
  });

  // ── Feedback text ("Correct!" / "Incorrect!") ───────────
  feedbackStim = new visual.TextStim({
    win:       psychoJS.window,
    name:      'feedback',
    text:      '',
    font:      'Arial',
    pos:       [0, 0.055],
    height:    0.075,
    bold:      true,
    color:     new util.Color('white'),
    colorSpace:'rgb',
    units:     'height',
  });

  // ── Progress indicator (bottom, centred) ────────────────
  progressText = new visual.TextStim({
    win:       psychoJS.window,
    name:      'progress',
    text:      '',
    font:      'Arial',
    pos:       [0, -0.44],
    height:    0.030,
    color:     new util.Color([0.4, 0.4, 0.4]),
    colorSpace:'rgb',
    units:     'height',
  });

  // ── Instructions screen ──────────────────────────────────
  instrText = new visual.TextStim({
    win:       psychoJS.window,
    name:      'instructions',
    text:      [
      'WISCONSIN CARD SORTING TEST',
      '',
      'You will see four cards displayed at the top of the screen.',
      'One card at a time will appear in the centre of the screen.',
      '',
      'Your task is to place each card under one of the four cards at the top',
      'by clicking on the card you think it belongs with.',
      '',
      'After each response you will be told whether it was CORRECT or INCORRECT.',
      'You will NOT be told the rule for sorting.',
      'The rule may change during the test.',
      'When you think the rule has changed,',
      'find the new rule as quickly as possible.',
      '',
      'Work as quickly and accurately as you can.',
      '',
      'Click anywhere or press SPACE to begin.',
    ].join('\n'),
    font:      'Arial',
    pos:       [0, 0],
    height:    0.037,
    wrapWidth: 1.4,
    color:     new util.Color('white'),
    colorSpace:'rgb',
    units:     'height',
  });

  // ── End screen ───────────────────────────────────────────
  endText = new visual.TextStim({
    win:       psychoJS.window,
    name:      'end',
    text:      'The test is now complete.\n\nThank you for your participation!\n\nPlease wait -- your data is being saved.',
    font:      'Arial',
    pos:       [0, 0],
    height:    0.055,
    wrapWidth: 1.3,
    color:     new util.Color('white'),
    colorSpace:'rgb',
    units:     'height',
  });

  return Scheduler.Event.NEXT;
}

// ─────────────────────────────────────────────────────────────
// INSTRUCTIONS ROUTINE
// ─────────────────────────────────────────────────────────────

function instrBegin() {
  _instrClock    = new util.Clock();
  _spacePressed  = false;
  [_prevMouseDown] = mouse.getPressed();
  instrText.setAutoDraw(true);
  return Scheduler.Event.NEXT;
}

function instrEachFrame() {
  const [lb] = mouse.getPressed();

  // Advance on first leading-edge click (> 0.5 s after display)
  const newClick = lb && !_prevMouseDown && _instrClock.getTime() > 0.5;
  if (newClick || _spacePressed) {
    instrText.setAutoDraw(false);
    return Scheduler.Event.NEXT;
  }
  _prevMouseDown = lb;
  return Scheduler.Event.FLIP_REPEAT;
}

function instrEnd() {
  instrText.setAutoDraw(false);
  _spacePressed    = false;
  [_prevMouseDown] = mouse.getPressed();
  return Scheduler.Event.NEXT;
}

// ─────────────────────────────────────────────────────────────
// TRIAL LOOP
// ─────────────────────────────────────────────────────────────

/** Schedules all 64 trial+feedback routine pairs upfront. */
function trialLoopBegin(scheduler) {
  return async function () {
    _currentSet    = 0;
    _correctInSet  = 0;
    _prevPrinciple = null;
    _done          = false;

    for (let i = 0; i < DECK.length; i++) {
      scheduler.add(trialBegin(i));
      scheduler.add(trialEachFrame);
      scheduler.add(trialEnd);         // plain function, not a factory
      scheduler.add(feedbackBegin);
      scheduler.add(feedbackEachFrame);
      scheduler.add(feedbackEnd(i));
      scheduler.add(checkDone(scheduler));
    }
    return Scheduler.Event.NEXT;
  };
}

function trialLoopEnd() {
  return Scheduler.Event.NEXT;
}

/**
 * Called after every trial+feedback pair.
 * Stops the loop scheduler early when all sets are complete.
 */
function checkDone(scheduler) {
  return function () {
    if (_done) {
      scheduler.stop(); // terminate loop; flowScheduler continues to endBegin
    }
    return Scheduler.Event.NEXT;
  };
}

// ─────────────────────────────────────────────────────────────
// TRIAL ROUTINE  (show stimulus → wait for reference-card click)
// ─────────────────────────────────────────────────────────────

function trialBegin(idx) {
  return function () {
    _card = DECK[idx];

    // Capture trial context BEFORE any state updates
    _trialPrinciple     = PRINCIPLES[_currentSet];
    _trialSetNumber     = _currentSet + 1;
    _trialPrevPrinciple = _prevPrinciple;

    // Set stimulus image
    stimImg.setImage(cardImage(_card.number, _card.color, _card.shape));

    // Progress label
    progressText.setText(
      `Trial ${idx + 1} / ${DECK.length}   |   Set ${_currentSet + 1} of ${PRINCIPLES.length}`,
    );

    // Draw all task elements
    for (const img of refImgs) img.setAutoDraw(true);
    stimImg.setAutoDraw(true);
    separator.setAutoDraw(true);
    progressText.setAutoDraw(true);

    // Initialise click detection (avoid carry-over from previous routine)
    _trialClock = new util.Clock();
    [_prevMouseDown] = mouse.getPressed();
    _clickedIdx  = null;

    return Scheduler.Event.NEXT;
  };
}

function trialEachFrame() {
  const [lb] = mouse.getPressed();

  // React only on the leading edge of a new click
  if (lb && !_prevMouseDown) {
    for (let i = 0; i < 4; i++) {
      if (refImgs[i].contains(mouse)) {
        _clickedIdx    = i;
        _rt            = _trialClock.getTime();
        _prevMouseDown = lb;
        return Scheduler.Event.NEXT; // response recorded → end routine
      }
    }
  }
  _prevMouseDown = lb;
  return Scheduler.Event.FLIP_REPEAT;
}

// trialEnd does not need the trial index — it works from global state
// captured in trialBegin, so it is a plain (non-factory) scheduler function.
function trialEnd() {
  // Hide stimulus (reference cards remain visible during feedback)
  stimImg.setAutoDraw(false);

  // ── Score the response ────────────────────────────────
  const correctIdx = getCorrectRefIdx(_card, _trialPrinciple);
  _correct         = (_clickedIdx === correctIdx);
  _usedPrinciples  = getUsedPrinciples(_card, _clickedIdx);
  _errorType       = getErrorType(_usedPrinciples, _trialPrinciple, _trialPrevPrinciple);

  // ── Update running state (AFTER capturing _trialPrinciple etc.) ──
  if (_correct) {
    _correctInSet++;
    if (_correctInSet >= CORRECT_PER_SET) {
      _prevPrinciple = _trialPrinciple; // save before advancing
      _currentSet++;
      _correctInSet = 0;
      if (_currentSet >= PRINCIPLES.length) {
        _done = true;
      }
    }
  } else {
    _correctInSet = 0; // any error resets the consecutive-correct counter
  }

  return Scheduler.Event.NEXT;
}

// ─────────────────────────────────────────────────────────────
// FEEDBACK ROUTINE  (show "Correct!" / "Incorrect!" for 1 s)
// ─────────────────────────────────────────────────────────────

function feedbackBegin() {
  _feedbackClock = new util.Clock();
  if (_correct) {
    feedbackStim.setText('Correct!');
    feedbackStim.setColor(new util.Color([-1, 0.8, -1])); // bright green
  } else {
    feedbackStim.setText('Incorrect!');
    feedbackStim.setColor(new util.Color([0.9, -1, -1])); // bright red
  }
  feedbackStim.setAutoDraw(true);
  return Scheduler.Event.NEXT;
}

function feedbackEachFrame() {
  if (_feedbackClock.getTime() >= 1.0) {
    return Scheduler.Event.NEXT;
  }
  return Scheduler.Event.FLIP_REPEAT;
}

function feedbackEnd(idx) {
  return function () {
    feedbackStim.setAutoDraw(false);

    // Hide task elements between trials
    for (const img of refImgs) img.setAutoDraw(false);
    separator.setAutoDraw(false);
    progressText.setAutoDraw(false);

    // ── Record data for this trial ────────────────────────
    psychoJS.experiment.addData('participant_id',     expInfo['participant_id']);
    psychoJS.experiment.addData('group',              expInfo['group']);
    psychoJS.experiment.addData('session',            expInfo['session']);
    psychoJS.experiment.addData('time_of_day',        expInfo['time_of_day']);
    psychoJS.experiment.addData('trial_number',       idx + 1);
    psychoJS.experiment.addData('set_number',         _trialSetNumber);

    // Stimulus card
    psychoJS.experiment.addData('card_image',         cardImage(_card.number, _card.color, _card.shape));
    psychoJS.experiment.addData('card_number',        _card.number);
    psychoJS.experiment.addData('card_color',         _card.color);
    psychoJS.experiment.addData('card_shape',         _card.shape);

    // Response
    psychoJS.experiment.addData('clicked_position',   _clickedIdx + 1);
    psychoJS.experiment.addData('clicked_color',      REF_CARDS[_clickedIdx].color);
    psychoJS.experiment.addData('clicked_shape',      REF_CARDS[_clickedIdx].shape);
    psychoJS.experiment.addData('clicked_number',     REF_CARDS[_clickedIdx].number);

    // Scoring
    psychoJS.experiment.addData('current_principle',  _trialPrinciple);
    psychoJS.experiment.addData('previous_principle', _trialPrevPrinciple || 'none');
    psychoJS.experiment.addData('principles_used',
      _usedPrinciples.length ? _usedPrinciples.join(',') : 'none');
    psychoJS.experiment.addData('correct',            _correct ? 1 : 0);
    psychoJS.experiment.addData('error_type',         _errorType);
    psychoJS.experiment.addData('rt',                 _rt);

    psychoJS.experiment.nextEntry(); // finalise row in the data file

    // Reset click state for next trial
    [_prevMouseDown] = mouse.getPressed();
    return Scheduler.Event.NEXT;
  };
}

// ─────────────────────────────────────────────────────────────
// END ROUTINE
// ─────────────────────────────────────────────────────────────

function endBegin() {
  _endClock     = new util.Clock();
  _spacePressed = false;
  [_prevMouseDown] = mouse.getPressed();
  endText.setAutoDraw(true);
  return Scheduler.Event.NEXT;
}

function endEachFrame() {
  // Hold end screen for at least 3 s, then allow advance
  if (_endClock.getTime() > 3.0) {
    const [lb] = mouse.getPressed();
    const newClick = lb && !_prevMouseDown;
    if (newClick || _spacePressed) {
      endText.setAutoDraw(false);
      return Scheduler.Event.NEXT;
    }
    _prevMouseDown = lb;
  }
  return Scheduler.Event.FLIP_REPEAT;
}

function endEnd() {
  endText.setAutoDraw(false);
  return Scheduler.Event.NEXT;
}

// ─────────────────────────────────────────────────────────────
// QUIT
// ─────────────────────────────────────────────────────────────

function quitPsychoJS() {
  if (psychoJS.window) {
    psychoJS.window.close();
  }
  psychoJS.quit({ message: 'Experiment complete', isCompleted: true });
  return Scheduler.Event.QUIT;
}
