import { Persona, QuizQuestion } from './types';
import { Moon, Circle, Eclipse } from 'lucide-react';

// --- PERSONA DEFINITIONS ---

export const AGE_GROUPS: Persona[] = [
  {
    id: 'child',
    name: 'Child Mode',
    label: 'Invisible Protection',
    icon: Moon,
    description: 'Invisible protection for young users.'
  },
  {
    id: 'teenager',
    name: 'Teen Mode',
    label: 'Guided Learning',
    icon: Eclipse,
    description: 'Learning to recognize manipulation.'
  },
  {
    id: 'adult',
    name: 'Adult Mode',
    label: 'Full Transparency',
    icon: Circle,
    description: 'Full transparency and scam protection. Includes accessibility features.'
  },
];

// --- GAMIFICATION CONSTANTS ---

export const CARD_ADJECTIVES = [
  "Swift", "Brave", "Vigilant", "Keen", "Steady",
  "Sharp", "Wise", "Bold", "Calm", "True",
  "Bright", "Quick", "Noble", "Pure", "Clear"
];

export const CARD_NOUNS = [
  "Guardian", "Seeker", "Spotter", "Walker", "Finder",
  "Shield", "Watcher", "Scout", "Sage", "Mind",
  "Spirit", "Light", "Force", "Heart", "Eye"
];

// --- QUIZ QUESTIONS ---

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "You see a post saying: 'You NEED to buy this NOW or you'll regret it forever!' What trick is this?",
    options: [
      "Fear Trick (scaring you)",
      "Shame Trick (making you feel bad)",
      "Urgency Trick (rushing you)",
      "Bandwagon Trick (everyone's doing it)"
    ],
    correctIndex: 2,
    explanation: "Correct! The 'Urgency Trick' tries to make you stop thinking and act fast before you realize you don't need it."
  },
  {
    id: 2,
    question: "A video says: 'Everyone is doing this challenge except you!' How do they want you to feel?",
    options: [
      "Happy and excited",
      "Left out (FOMO)",
      "Smart and careful",
      "Bored"
    ],
    correctIndex: 1,
    explanation: "Right! 'FOMO' stands for Fear Of Missing Out. They want you to join in just to fit in."
  },
  {
    id: 3,
    question: "Someone comments: 'If you don't look like this, you're lazy.' What is this called?",
    options: [
      "A helpful tip",
      "A friendly joke",
      "Shame/Guilt Trick",
      "A secret code"
    ],
    correctIndex: 2,
    explanation: "Correct. Making people feel bad about themselves (Shame) is a mean trick to get likes or sell things."
  }
];

// --- ANALYSIS EXAMPLES ---

export const ANALYSIS_EXAMPLES: Record<string, string[]> = {
  "Health Misinfo": [
    "Doctors are LYING to you about this simple fruit that CURES cancer!!!",
    "Big Pharma doesn't want you to know this ONE trick that eliminates all disease!!!"
  ],
  "Financial Scams": [
    "I turned $100 into $10,000 in ONE day with this crypto secret. DM me NOW to learn how!",
    "Banks are collapsing! Move your money to GoldCoin before it's too late!"
  ],
  "Body Image": [
    "If you don't have a thigh gap, you need to work harder. No excuses.",
    "Lose 20lbs in 1 week with this tea! Results guaranteed!"
  ],
  "Fear Appeals": [
    "They're coming for your children. WAKE UP before it's too late!!!",
    "The government is hiding this from you. Share before they delete this!"
  ]
};
