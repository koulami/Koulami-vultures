import { GameState } from '../types/game';

// Inline high-quality SVG graphic data URLs for instant, offline, robust asset rendering
export const SVG_IMAGES = {
  parthenon: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="70%" stop-color="#bae6fd"/>
          <stop offset="100%" stop-color="#fef08a"/>
        </linearGradient>
        <linearGradient id="marble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#sky)"/>
      <circle cx="480" cy="90" r="45" fill="#fef08a" opacity="0.8"/>
      <!-- Hill / Rock base -->
      <path d="M 0,320 Q 150,290 300,310 T 600,330 L 600,400 L 0,400 Z" fill="#64748b"/>
      <path d="M 50,330 Q 300,300 550,330 L 530,350 L 70,350 Z" fill="#475569"/>
      <!-- Acropolis Pediment & Columns -->
      <polygon points="120,180 300,120 480,180" fill="url(#marble)" stroke="#94a3b8" stroke-width="3"/>
      <rect x="110" y="180" width="380" height="24" rx="2" fill="url(#marble)" stroke="#94a3b8"/>
      <!-- Columns -->
      <g fill="url(#marble)" stroke="#94a3b8" stroke-width="2">
        <rect x="140" y="204" width="22" height="110" rx="3"/>
        <rect x="185" y="204" width="22" height="110" rx="3"/>
        <rect x="230" y="204" width="22" height="110" rx="3"/>
        <rect x="275" y="204" width="22" height="110" rx="3"/>
        <rect x="320" y="204" width="22" height="110" rx="3"/>
        <rect x="365" y="204" width="22" height="110" rx="3"/>
        <rect x="410" y="204" width="22" height="110" rx="3"/>
      </g>
      <!-- Base steps -->
      <rect x="115" y="314" width="370" height="14" rx="2" fill="url(#marble)" stroke="#94a3b8"/>
      <rect x="95" y="328" width="410" height="16" rx="2" fill="url(#marble)" stroke="#94a3b8"/>
    </svg>
  `)}`,

  chameleon: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#064e3b"/>
          <stop offset="100%" stop-color="#022c22"/>
        </linearGradient>
        <linearGradient id="cham" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="50%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#84cc16"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#bg)"/>
      <!-- Tropical branch -->
      <path d="M 20,290 C 180,270 360,280 580,240" stroke="#78350f" stroke-width="26" fill="none" stroke-linecap="round"/>
      <path d="M 20,290 C 180,270 360,280 580,240" stroke="#a16207" stroke-width="18" fill="none" stroke-linecap="round"/>
      <!-- Chameleon Body -->
      <ellipse cx="280" cy="220" rx="100" ry="60" fill="url(#cham)"/>
      <circle cx="370" cy="190" r="45" fill="url(#cham)"/>
      <!-- Eye -->
      <circle cx="380" cy="185" r="20" fill="#facc15" stroke="#047857" stroke-width="5"/>
      <circle cx="385" cy="185" r="7" fill="#0f172a"/>
      <!-- Curl tail -->
      <path d="M 180,230 C 130,220 100,260 120,295 C 135,320 170,305 160,280 C 152,265 138,275 142,285" fill="none" stroke="url(#cham)" stroke-width="22" stroke-linecap="round"/>
      <!-- Legs gripping branch -->
      <path d="M 240,260 L 235,280 L 250,285" stroke="#047857" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 330,250 L 335,270 L 350,275" stroke="#047857" stroke-width="12" fill="none" stroke-linecap="round"/>
      <!-- Crest -->
      <polygon points="330,150 350,170 380,145 400,165" fill="#facc15"/>
    </svg>
  `)}`,

  treasureMap: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
      <defs>
        <linearGradient id="parchment" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="50%" stop-color="#fde68a"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#parchment)"/>
      <!-- Ocean Waves & Grid -->
      <path d="M 0,0 L 600,0 L 600,400 L 0,400 Z" fill="none" stroke="#b45309" stroke-width="6"/>
      <line x1="150" y1="10" x2="150" y2="390" stroke="#d97706" stroke-width="1" stroke-dasharray="8 8" opacity="0.6"/>
      <line x1="300" y1="10" x2="300" y2="390" stroke="#d97706" stroke-width="1" stroke-dasharray="8 8" opacity="0.6"/>
      <line x1="450" y1="10" x2="450" y2="390" stroke="#d97706" stroke-width="1" stroke-dasharray="8 8" opacity="0.6"/>
      <!-- Islands -->
      <path d="M 70,120 Q 120,60 210,90 T 260,180 Q 200,240 120,210 Z" fill="#65a30d" stroke="#4d7c0f" stroke-width="4"/>
      <path d="M 360,200 Q 420,150 510,180 T 540,290 Q 460,340 370,300 Z" fill="#65a30d" stroke="#4d7c0f" stroke-width="4"/>
      <path d="M 330,80 Q 380,50 420,70 T 400,120 Z" fill="#84cc16" stroke="#4d7c0f" stroke-width="3"/>
      <!-- Red Dotted Trail -->
      <path d="M 160,150 C 240,110 320,160 370,140 C 430,120 440,220 460,260" fill="none" stroke="#dc2626" stroke-width="4" stroke-dasharray="8 8"/>
      <!-- Big Red X Marks the Spot -->
      <line x1="440" y1="240" x2="480" y2="280" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
      <line x1="480" y1="240" x2="440" y2="280" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>
      <!-- Compass Rose -->
      <g transform="translate(100, 310)">
        <circle cx="0" cy="0" r="32" fill="#fffbeb" stroke="#b45309" stroke-width="2"/>
        <polygon points="0,-28 6,-6 28,0 6,6 0,28 -6,6 -28,0 -6,-6" fill="#b45309"/>
        <polygon points="0,-28 0,0 28,0" fill="#dc2626"/>
        <text x="-4" y="-34" font-family="sans-serif" font-weight="bold" font-size="12" fill="#78350f">N</text>
      </g>
      <!-- Title banner -->
      <text x="210" y="42" font-family="serif" font-weight="bold" font-size="22" fill="#78350f" letter-spacing="3">MYSTIC QUEST MAP</text>
    </svg>
  `)}`,

  telescope: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <rect width="300" height="300" rx="16" fill="#0f172a"/>
      <circle cx="210" cy="70" r="35" fill="#facc15" opacity="0.9"/>
      <path d="M 50,260 L 150,150 L 170,165 L 70,275 Z" fill="#64748b"/>
      <polygon points="120,170 230,80 250,95 140,185" fill="#38bdf8"/>
      <line x1="150" y1="160" x2="100" y2="280" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
      <line x1="150" y1="160" x2="150" y2="280" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
      <line x1="150" y1="160" x2="200" y2="280" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
    </svg>
  `)}`,

  microscope: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <rect width="300" height="300" rx="16" fill="#0f172a"/>
      <rect x="70" y="240" width="160" height="30" rx="8" fill="#475569"/>
      <path d="M 120,240 C 110,180 140,110 200,90" fill="none" stroke="#64748b" stroke-width="18" stroke-linecap="round"/>
      <polygon points="140,70 190,40 205,65 155,95" fill="#10b981"/>
      <rect x="110" y="150" width="80" height="12" rx="4" fill="#cbd5e1"/>
      <circle cx="150" cy="156" r="14" fill="#38bdf8" opacity="0.8"/>
    </svg>
  `)}`,

  compass: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <rect width="300" height="300" rx="16" fill="#0f172a"/>
      <circle cx="150" cy="150" r="100" fill="#1e293b" stroke="#f59e0b" stroke-width="10"/>
      <circle cx="150" cy="150" r="85" fill="#0f172a" stroke="#cbd5e1" stroke-width="3"/>
      <polygon points="150,65 165,150 135,150" fill="#ef4444"/>
      <polygon points="150,235 165,150 135,150" fill="#94a3b8"/>
      <circle cx="150" cy="150" r="10" fill="#f59e0b"/>
      <text x="144" y="90" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ef4444">N</text>
    </svg>
  `)}`,

  atom: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <rect width="300" height="300" rx="16" fill="#0f172a"/>
      <circle cx="150" cy="150" r="22" fill="#8b5cf6"/>
      <ellipse cx="150" cy="150" rx="100" ry="38" fill="none" stroke="#06b6d4" stroke-width="5" transform="rotate(0 150 150)"/>
      <ellipse cx="150" cy="150" rx="100" ry="38" fill="none" stroke="#06b6d4" stroke-width="5" transform="rotate(60 150 150)"/>
      <ellipse cx="150" cy="150" rx="100" ry="38" fill="none" stroke="#06b6d4" stroke-width="5" transform="rotate(120 150 150)"/>
      <circle cx="250" cy="150" r="8" fill="#facc15"/>
      <circle cx="100" cy="64" r="8" fill="#facc15"/>
      <circle cx="100" cy="236" r="8" fill="#facc15"/>
    </svg>
  `)}`
};

export const INITIAL_GAME_STATE: GameState = {
  id: 'arena-session-1',
  title: 'BoundPad Epic Challenge',
  description: 'Διαδραστικό κυνήγι γνώσης & δεξιοτήτων ομάδων',
  title_en: 'BoundPad Epic Challenge',
  description_en: 'Interactive Team Knowledge & Skills Quest',
  phase: 'waiting_lobby',
  synthesisPrompt: 'Συνθέστε τα συμπεράσματα, τα στοιχεία και τις πληροφορίες που αντλήσατε από τις αποστολές για τη συζήτηση στην τάξη:',
  synthesisPrompt_en: 'Synthesize your findings, evidence, and discoveries from the quests for the classroom discussion:',
  synthesisNotes: [],
  activeRound: 1,
  updatedAt: Date.now(),
  timer: {
    totalSeconds: 1200, // 20 minutes default
    remainingSeconds: 1200,
    isRunning: false,
    updatedAt: Date.now()
  },
  teams: [
    {
      id: 'team-alpha',
      name: 'Ομάδα Α: Οι Εξερευνητές',
      name_en: 'Team A: The Explorers',
      color: '#10b981', // Emerald
      avatar: '🧭',
      slogan: 'Ανακαλύπτουμε τα πάντα!',
      slogan_en: 'Discovering everything!'
    },
    {
      id: 'team-beta',
      name: 'Ομάδα Β: Οι Καινοτόμοι',
      name_en: 'Team B: The Innovators',
      color: '#06b6d4', // Cyan
      avatar: '⚡',
      slogan: 'Ταχύτητα και σκέψη!',
      slogan_en: 'Speed and intellect!'
    },
    {
      id: 'team-gamma',
      name: 'Ομάδα Γ: Οι Ταξιδιώτες',
      name_en: 'Team C: The Voyagers',
      color: '#f59e0b', // Amber
      avatar: '🚀',
      slogan: 'Στοχεύουμε στα αστέρια!',
      slogan_en: 'Aiming for the stars!'
    },
    {
      id: 'team-delta',
      name: 'Ομάδα Δ: Οι Επιστήμονες',
      name_en: 'Team D: The Scientists',
      color: '#8b5cf6', // Purple
      avatar: '🔬',
      slogan: 'Η λογική κερδίζει!',
      slogan_en: 'Logic prevails!'
    }
  ],
  questions: [
    {
      id: 'quest-1',
      title: 'Κουίζ με Φωτογραφία: Ιστορικό Μνημείο',
      title_en: 'Photo Quiz: Historic Monument',
      description: 'Παρατηρήστε την εικόνα και επιλέξτε το σωστό μνημείο της αρχαίας κλασικής εποχής.',
      description_en: 'Observe the image and select the correct monument from classical antiquity.',
      type: 'multiple_choice',
      points: 100,
      imageUrl: SVG_IMAGES.parthenon,
      assignedTeamIds: ['team-alpha', 'team-gamma', 'team-delta'],
      payload: {
        options: [
          'Ο Παρθενώνας στην Ακρόπολη Αθηνών',
          'Το Κολοσσαίο στη Ρώμη',
          'Ο Ναός του Απόλλωνα στους Δελφούς',
          'Η Πύλη του Βρανδεμβούργου'
        ],
        correctOptionIndex: 0,
        correctOptionIndices: [0]
      },
      payload_en: {
        options: [
          'The Parthenon on the Acropolis of Athens',
          'The Colosseum in Rome',
          'The Temple of Apollo in Delphi',
          'The Brandenburg Gate'
        ],
        correctOptionIndex: 0,
        correctOptionIndices: [0]
      },
      explanation: 'Ο Παρθενώνας κατασκευάστηκε τον 5ο αιώνα π.Χ. προς τιμήν της θεάς Αθηνάς.',
      explanation_en: 'The Parthenon was built in the 5th century BC in honour of the goddess Athena.'
    },
    {
      id: 'quest-2',
      title: 'Σωστό ή Λάθος: Βιολογία & Φύση',
      title_en: 'True or False: Biology & Nature',
      description: 'Εξετάστε τον ακόλουθο ισχυρισμό σχετικά με τη συμπεριφορά του χαμαιλέοντα.',
      description_en: 'Evaluate the following claim regarding chameleon behaviour: "Chameleons change colour exclusively for camouflage to hide from predators."',
      type: 'true_false',
      points: 80,
      imageUrl: SVG_IMAGES.chameleon,
      assignedTeamIds: ['team-beta', 'team-delta'],
      payload: {
        correctValue: false
      },
      payload_en: {
        correctValue: false
      },
      explanation: 'Λάθος! Οι χαμαιλέοντες αλλάζουν χρώμα κυρίως για επικοινωνία, ρύθμιση θερμοκρασίας και διάθεση, και όχι αποκλειστικά για καμουφλάζ.',
      explanation_en: 'False! Chameleons change colour primarily for communication, temperature regulation, and mood, rather than solely for camouflage.'
    },
    {
      id: 'quest-3',
      title: 'Αντιστοίχιση Κειμένου: Πρωτεύουσες Ευρώπης',
      title_en: 'Text Matching: European Capitals',
      description: 'Αντιστοιχίστε κάθε χώρα με τη σωστή πρωτεύουσά της.',
      description_en: 'Match each country with its correct capital city.',
      type: 'text_match',
      points: 120,
      assignedTeamIds: ['team-alpha', 'team-beta'],
      payload: {
        pairs: [
          { id: 'p1', left: 'Ελλάδα', right: 'Αθήνα' },
          { id: 'p2', left: 'Γαλλία', right: 'Παρίσι' },
          { id: 'p3', left: 'Ιταλία', right: 'Ρώμη' },
          { id: 'p4', left: 'Πορτογαλία', right: 'Λισαβόνα' }
        ]
      },
      payload_en: {
        pairs: [
          { id: 'p1', left: 'Greece', right: 'Athens' },
          { id: 'p2', left: 'France', right: 'Paris' },
          { id: 'p3', left: 'Italy', right: 'Rome' },
          { id: 'p4', left: 'Portugal', right: 'Lisbon' }
        ]
      }
    },
    {
      id: 'quest-4',
      title: 'Αντιστοίχιση Εικόνας με Κείμενο: Επιστημονικά Όργανα',
      title_en: 'Image-to-Text Matching: Scientific Instruments',
      description: 'Συνδέστε κάθε εικόνα επιστημονικού οργάνου με το αντίστοιχο όνομα και πεδίο χρήσης.',
      description_en: 'Match each scientific instrument image with its name and field of application.',
      type: 'image_match',
      points: 150,
      assignedTeamIds: ['team-gamma', 'team-delta'],
      payload: {
        pairs: [
          { id: 'im1', image: SVG_IMAGES.telescope, text: 'Τηλεσκόπιο (Αστρονομία & Παρατήρηση Διαστήματος)' },
          { id: 'im2', image: SVG_IMAGES.microscope, text: 'Μικροσκόπιο (Βιολογία & Κυτταρική Έρευνα)' },
          { id: 'im3', image: SVG_IMAGES.compass, text: 'Πυξίδα (Προσανατολισμός & Γεωγραφία)' },
          { id: 'im4', image: SVG_IMAGES.atom, text: 'Μοντέλο Ατόμου (Κβαντική & Πυρηνική Φυσική)' }
        ]
      },
      payload_en: {
        pairs: [
          { id: 'im1', image: SVG_IMAGES.telescope, text: 'Telescope (Astronomy & Space Observation)' },
          { id: 'im2', image: SVG_IMAGES.microscope, text: 'Microscope (Biology & Cellular Research)' },
          { id: 'im3', image: SVG_IMAGES.compass, text: 'Compass (Orientation & Geography)' },
          { id: 'im4', image: SVG_IMAGES.atom, text: 'Atom Model (Quantum & Nuclear Physics)' }
        ]
      }
    },
    {
      id: 'quest-5',
      title: 'Σκανάρισμα QR Code: Μυστικός Σταθμός',
      title_en: 'QR Code Hunt: Secret Station',
      description: 'Βρείτε το QR Code του πρώτου σταθμού (κωδικός: BOUND-ALPHA-2026), σαρώστε το με την κάμερα ή πληκτρολογήστε τον κωδικό σταθμού.',
      description_en: 'Find the QR Code for Station 1 (passcode: BOUND-ALPHA-2026), scan it with the camera, or enter the station passcode.',
      type: 'qr_scan',
      points: 150,
      assignedTeamIds: ['team-alpha', 'team-delta'],
      payload: {
        targetCode: 'BOUND-ALPHA-2026',
        locationHint: 'Ο σταθμός βρίσκεται στον κεντρικό πίνακα ή στην κάρτα σταθμών του διαχειριστή.',
        unlockedMedia: {
          type: 'image',
          url: SVG_IMAGES.treasureMap,
          title: 'Χάρτης Κρυμμένου Θησαυρού',
          caption: 'Συγχαρητήρια! Ξεκλειδώσατε τον ιστορικό χάρτη της αποστολής. Μελετήστε τα σημεία ενδιαφέροντος για το επόμενο στάδιο.'
        }
      },
      payload_en: {
        targetCode: 'BOUND-ALPHA-2026',
        locationHint: 'The station is located on the main board or on the facilitator station card.',
        unlockedMedia: {
          type: 'image',
          url: SVG_IMAGES.treasureMap,
          title: 'Hidden Treasure Map',
          caption: 'Congratulations! You unlocked the historical expedition map. Study the points of interest for the next phase.'
        }
      }
    },
    {
      id: 'quest-6',
      title: 'Δημιουργική Αποστολή: Ομαδική Φωτογραφία',
      title_en: 'Creative Challenge: Team Photo',
      description: 'Βγάλτε μία διασκεδαστική ομαδική φωτογραφία όπου όλα τα μέλη σχηματίζουν ένα γράμμα ή δείχνουν με χαμόγελο προς την κάμερα!',
      description_en: 'Take a fun team photograph where all members form a letter or smile toward the camera!',
      type: 'photo_upload',
      points: 180,
      assignedTeamIds: ['team-beta', 'team-gamma'],
      payload: {
        instructions: 'Χρησιμοποιήστε την κάμερα του κινητού ή υπολογιστή ή ανεβάστε μια πρόσφατη φωτογραφία της ομάδας σας.'
      },
      payload_en: {
        instructions: 'Use your device camera or upload a recent photo of your team.'
      }
    },
    {
      id: 'quest-text-quiz',
      title: 'Κουίζ Γνώσεων: Το Μεγαλύτερο Θηλαστικό (Χωρίς Φωτογραφία)',
      title_en: 'Knowledge Quiz: The Largest Mammal',
      description: 'Ποιο από τα παρακάτω είναι το μεγαλύτερο ζώο που έχει ζήσει ποτέ στον πλανήτη Γη;',
      description_en: 'Which of the following is the largest animal ever known to have lived on planet Earth?',
      type: 'multiple_choice',
      points: 100,
      assignedTeamIds: ['team-beta', 'team-alpha'],
      payload: {
        options: [
          'Η Γαλάζια Φάλαινα (Balaenoptera musculus)',
          'Ο Αφρικανικός Ελέφαντας',
          'Ο Μεγαλόδοντας',
          'Ο Τυραννόσαυρος Ρεξ'
        ],
        correctOptionIndex: 0,
        correctOptionIndices: [0]
      },
      payload_en: {
        options: [
          'The Blue Whale (Balaenoptera musculus)',
          'The African Elephant',
          'The Megalodon',
          'The Tyrannosaurus Rex'
        ],
        correctOptionIndex: 0,
        correctOptionIndices: [0]
      },
      explanation: 'Η γαλάζια φάλαινα μπορεί να φτάσει σε μήκος τα 30 μέτρα και βάρος τους 190 τόνους!',
      explanation_en: 'The blue whale can reach up to 30 metres in length and weigh as much as 190 tonnes!'
    },
    {
      id: 'quest-text-tf',
      title: 'Σωστό ή Λάθος: Ηλιακό Σύστημα (Χωρίς Φωτογραφία)',
      title_en: 'True or False: Solar System',
      description: 'Η Γη χρειάζεται περίπου 365 ημέρες και 6 ώρες για να ολοκληρώσει μία πλήρη περιφορά γύρω από τον Ήλιο.',
      description_en: 'Earth takes approximately 365 days and 6 hours to complete one full revolution around the Sun.',
      type: 'true_false',
      points: 90,
      assignedTeamIds: ['team-gamma', 'team-delta'],
      payload: {
        correctValue: true
      },
      payload_en: {
        correctValue: true
      },
      explanation: 'Σωστό! Για τον λόγο αυτό προσθέτουμε μία επιπλέον ημέρα κάθε τέσσερα έτη (δίσεκτο έτος).',
      explanation_en: 'True! This is why we add an extra day every four years (leap year).'
    },
    {
      id: 'quest-7',
      title: 'Παζλ Εικόνας: Ο Χάρτης των Θησαυρών',
      title_en: 'Jigsaw Puzzle: Treasure Map',
      description: 'Ανασυνθέστε την εικόνα ενώνοντας τα κομμάτια! Μπορείτε να επιλέξετε 4, 6 ή 9 κομμάτια.',
      description_en: 'Reconstruct the image by connecting the pieces! You can choose 4, 6, or 9 pieces.',
      type: 'puzzle',
      points: 200,
      imageUrl: SVG_IMAGES.treasureMap,
      payload: {
        imageUrl: SVG_IMAGES.treasureMap,
        gridPieces: 6 // 6 pieces (3x2) default, selectable 4, 6, 9
      },
      payload_en: {
        imageUrl: SVG_IMAGES.treasureMap,
        gridPieces: 6
      }
    },
    {
      id: 'quest-8',
      title: 'Αποστολή Πεδίου: Έρευνα & Συνεργασία',
      title_en: 'Field Mission: Research & Collaboration',
      description: 'Εκτελέστε τα βήματα της αποστολής με την ομάδα σας, σημειώστε τα ευρήματα και υποβάλετε την αναφορά σας!',
      description_en: 'Execute the mission steps with your team, record your findings, and submit your report!',
      type: 'task',
      points: 220,
      imageUrl: SVG_IMAGES.compass,
      payload: {
        instructions: 'Εντοπίστε 3 ιστορικά ή επιστημονικά στοιχεία στον χώρο, καταγράψτε τα και υποβάλετε την αναφορά και φωτογραφία της ομάδας!',
        checklist: [
          'Βήμα 1: Συγκέντρωση της ομάδας & ανάθεση ρόλων',
          'Βήμα 2: Εντοπισμός και καταγραφή των 3 στοιχείων',
          'Βήμα 3: Σύνταξη σύντομης αναφοράς και λήψη τελικής φωτογραφίας'
        ],
        requiresEvidence: 'both',
        completionPrompt: 'Γράψτε εδώ τη σύντομη αναφορά των ευρημάτων σας:'
      },
      payload_en: {
        instructions: 'Locate 3 historical or scientific artifacts in the area, document them, and submit your team report and photo!',
        checklist: [
          'Step 1: Gather the team & assign roles',
          'Step 2: Locate and document the 3 elements',
          'Step 3: Write a brief summary report and take a final team photo'
        ],
        requiresEvidence: 'both',
        completionPrompt: 'Enter your brief report of findings here:'
      },
      explanation: 'Εξαιρετική ομαδική συνεργασία και επιτυχής ολοκλήρωση αποστολής πεδίου!',
      explanation_en: 'Outstanding teamwork and successful completion of the field mission!'
    },
    {
      id: 'quest-delta-mc',
      title: 'Κουίζ Πολλαπλής Επιλογής: Επιστημονική Μέθοδος & Έρευνα',
      title_en: 'Multiple Choice Quiz: Scientific Method & Research',
      description: 'Ποιες από τις παρακάτω προτάσεις ισχύουν για την επιστημονική μέθοδο και τα πειράματα; (Προσοχή: Υπάρχουν περισσότερες από μία σωστές απαντήσεις!)',
      description_en: 'Which of the following statements apply to the scientific method and experiments? (Note: More than one answer is correct!)',
      type: 'multiple_choice',
      points: 140,
      imageUrl: SVG_IMAGES.telescope,
      assignedTeamIds: ['team-delta', 'team-beta'],
      payload: {
        options: [
          'Ένα επιστημονικό πείραμα πρέπει να μπορεί να επαναληφθεί από άλλους ερευνητές',
          'Μια επιστημονική υπόθεση ελέγχεται πάντα με παρατηρήσεις, δεδομένα και δοκιμές',
          'Μια επιστημονική θεωρία δεν επιτρέπεται ποτέ να αμφισβητηθεί ή να τροποποιηθεί',
          'Τα αποτελέσματα καταγράφονται αντικειμενικά με μετρήσεις και στοιχεία'
        ],
        correctOptionIndex: 0,
        correctOptionIndices: [0, 1, 3]
      },
      payload_en: {
        options: [
          'A scientific experiment must be reproducible by other researchers',
          'A hypothesis is always tested with observations, data, and tests',
          'A scientific theory can never be challenged or modified',
          'Results are recorded objectively using measurements and evidence'
        ],
        correctOptionIndex: 0,
        correctOptionIndices: [0, 1, 3]
      },
      explanation: 'Σωστά! Η επιστημονική μέθοδος βασίζεται στην επαναληψιμότητα, τον έλεγχο υποθέσεων και τις αντικειμενικές μετρήσεις. Οι επιστημονικές θεωρίες εξελίσσονται διαρκώς όταν προκύπτουν νέα δεδομένα.',
      explanation_en: 'Correct! The scientific method relies on repeatability, hypothesis testing, and objective measurements. Scientific theories constantly evolve as new evidence emerges.'
    },
    {
      id: 'quest-delta-station',
      title: 'Σταθμός QR Εργαστηρίου: Μυστικό Πείραμα',
      title_en: 'Laboratory QR Station: Secret Experiment',
      description: 'Βρείτε το QR Code του εργαστηρίου της 4ης ομάδας (κωδικός: LAB-DELTA-2026), σαρώστε το με την κάμερα για να ξεκλειδώσετε το επιστημονικό υλικό!',
      description_en: 'Find the 4th team laboratory QR Code (passcode: LAB-DELTA-2026), scan it with the camera to unlock the scientific material!',
      type: 'qr_scan',
      points: 150,
      assignedTeamIds: ['team-delta', 'team-alpha'],
      payload: {
        targetCode: 'LAB-DELTA-2026',
        locationHint: 'Ο σταθμός βρίσκεται στον πάγκο εργαστηρίου ή στην κάρτα επιστημών της 4ης ομάδας.',
        unlockedMedia: {
          type: 'image',
          url: SVG_IMAGES.atom,
          title: 'Μοντέλο Ατόμου & Εργαστηριακό Υλικό',
          caption: 'Συγχαρητήρια στην Ομάδα Δ! Ξεκλειδώσατε το επιστημονικό μοντέλο του εργαστηρίου.'
        }
      },
      payload_en: {
        targetCode: 'LAB-DELTA-2026',
        locationHint: 'The station is located at the laboratory bench or on the 4th team science card.',
        unlockedMedia: {
          type: 'image',
          url: SVG_IMAGES.atom,
          title: 'Atomic Model & Laboratory Material',
          caption: 'Congratulations to Team D! You unlocked the laboratory scientific model.'
        }
      }
    },
    {
      id: 'quest-delta-match',
      title: 'Αντιστοίχιση Κειμένου: Σπουδαίες Επιστημονικές Ανακαλύψεις',
      title_en: 'Text Matching: Great Scientific Discoveries',
      description: 'Συνδέστε κάθε σπουδαίο επιστήμονα με την ιστορική ανακάλυψη ή αρχή που διατύπωσε!',
      description_en: 'Match each renowned scientist with their historical discovery or formulated principle!',
      type: 'text_match',
      points: 130,
      imageUrl: SVG_IMAGES.microscope,
      assignedTeamIds: ['team-delta'],
      payload: {
        pairs: [
          { id: 'p-newton', left: 'Ισαάκ Νεύτων', right: 'Νόμος της Παγκόσμιας Έλξης' },
          { id: 'p-curie', left: 'Μαρία Κιουρί', right: 'Ραδιενέργεια & Στοιχεία Ράδιο/Πολώνιο' },
          { id: 'p-einstein', left: 'Άλμπερτ Αϊνστάιν', right: 'Θεωρία της Σχετικότητας' },
          { id: 'p-archimedes', left: 'Αρχιμήδης', right: 'Αρχή της Άνωσης & Υδροστατική' }
        ]
      },
      payload_en: {
        pairs: [
          { id: 'p-newton', left: 'Isaac Newton', right: 'Law of Universal Gravitation' },
          { id: 'p-curie', left: 'Marie Curie', right: 'Radioactivity & Radium/Polonium Elements' },
          { id: 'p-einstein', left: 'Albert Einstein', right: 'Theory of Relativity' },
          { id: 'p-archimedes', left: 'Archimedes', right: 'Principle of Buoyancy & Hydrostatics' }
        ]
      },
      explanation: 'Εξαιρετικά! Και οι τέσσερις ανακαλύψεις άλλαξαν ριζικά την πορεία της ανθρώπινης επιστήμης και τεχνολογίας.',
      explanation_en: 'Superb! All four discoveries fundamentally transformed human science and technology.'
    },
    {
      id: 'quest-delta-creative',
      title: 'Δημιουργική Αποστολή: Το Σύμβολο των Επιστημόνων',
      title_en: "Creative Challenge: The Scientists' Emblem",
      description: 'Βγάλτε μία διασκεδαστική ομαδική φωτογραφία όπου όλα τα μέλη συνεργάζονται σαν ερευνητική ομάδα εργαστηρίου ή σχηματίζουν με τα χέρια τους το σύμβολο του ατόμου!',
      description_en: 'Take a fun team photo where all members collaborate like a laboratory research squad or form an atom symbol with their hands!',
      type: 'photo_upload',
      points: 160,
      imageUrl: SVG_IMAGES.atom,
      assignedTeamIds: ['team-delta'],
      payload: {
        instructions: 'Χρησιμοποιήστε την κάμερα του υπολογιστή/κινητού ή ανεβάστε μια φωτογραφία της Ομάδας Δ εν δράσει!'
      },
      payload_en: {
        instructions: 'Use your device camera or upload a photo of Team D in action!'
      },
      explanation: 'Η φωτογραφία της Ομάδας Δ κατοχυρώθηκε με επιτυχία στο αρχείο ερευνών!',
      explanation_en: "Team D's photograph was successfully registered in the research archive!"
    }
  ],
  submissions: {}
};
