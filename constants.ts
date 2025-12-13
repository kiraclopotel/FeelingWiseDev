
import { Post, Persona, AgeGroup, ScamScenario, QuizQuestion, PostCategory } from './types';
import { Moon, Circle, Eclipse, User, Package, Building2, Heart, Monitor, Scale } from 'lucide-react';

export const AGE_GROUPS: Persona[] = [
  { 
    id: 'child', 
    name: 'Child Mode', 
    label: 'Invisible Protection', 
    icon: Moon, // Crescent
    description: 'Invisible protection for young users.' 
  },
  { 
    id: 'teenager', 
    name: 'Teen Mode', 
    label: 'Guided Learning', 
    icon: Eclipse, // Half/Quarter
    description: 'Learning to recognize manipulation.' 
  },
  { 
    id: 'adult', 
    name: 'Adult Mode', 
    label: 'Full Transparency', 
    icon: Circle, // Full Moon
    description: 'Full transparency and scam protection. Includes accessibility features.' 
  },
];

export const SCAM_SCENARIOS: ScamScenario[] = [
  {
    id: 'grandparent',
    title: 'Grandparent Scam',
    contactName: 'Grandson (Unknown)',
    icon: User,
    messages: [
      { id: 1, sender: 'scammer', text: 'Hi grandma it’s me', delay: 0 },
      { id: 2, sender: 'scammer', text: 'I’m in a bit of trouble and really need your help', delay: 1500 },
      { id: 3, sender: 'scammer', text: 'Please don’t tell mom and dad, they’ll kill me', delay: 3000 },
      { id: 4, sender: 'scammer', text: 'I need $500 for bail. Can you send gift cards?', delay: 5000 },
    ],
    finalAnalysis: {
      probability: 95,
      flags: ['Creating urgency', 'Requesting secrecy', 'Unusual payment method (gift cards)', 'Emotional manipulation'],
      technique: 'Grandparent Scam',
      explanation: 'Pretends to be a family member in crisis to extract money quickly while bypassing verification.',
      recommendation: 'Call the real family member at their known number immediately to verify. Do not send money.'
    }
  },
  {
    id: 'package',
    title: 'Package Delivery',
    contactName: 'USPS-Service',
    icon: Package,
    messages: [
      { id: 1, sender: 'scammer', text: 'USPS: Your package US-9281 could not be delivered due to incomplete address.', delay: 0 },
      { id: 2, sender: 'scammer', text: 'Please click here to update your details: bit.ly/usps-fix-now', delay: 2000 },
      { id: 3, sender: 'scammer', text: 'Failure to update within 12h will result in return to sender.', delay: 4000 },
    ],
    finalAnalysis: {
      probability: 92,
      flags: ['Phishing link (bit.ly)', 'False urgency', 'Generic request'],
      technique: 'Smishing (SMS Phishing)',
      explanation: 'Uses a fake delivery issue to steal personal information or credit card details via a fraudulent link.',
      recommendation: 'Do not click the link. Track the package on the official USPS website using a tracking number you already have.'
    }
  },
  {
    id: 'bank',
    title: 'Bank Alert',
    contactName: 'Bank-Security',
    icon: Building2,
    messages: [
      { id: 1, sender: 'scammer', text: 'ALERT: Unusual activity detected on your checking account ending in 8832.', delay: 0 },
      { id: 2, sender: 'scammer', text: 'Did you authorize a charge of $499.00 at TARGET?', delay: 2000 },
      { id: 3, sender: 'scammer', text: 'Reply YES to confirm or call 1-800-555-0199 immediately to prevent account freeze.', delay: 4000 },
    ],
    finalAnalysis: {
      probability: 88,
      flags: ['False urgency', 'Threat of "account freeze"', 'Directing to fake phone number'],
      technique: 'Bank Impersonation',
      explanation: 'Scammers spoof bank numbers to get you to reveal login credentials or transfer money.',
      recommendation: 'Do not reply. Call the number on the back of your actual debit card, not the number in the text.'
    }
  },
  {
    id: 'romance',
    title: 'Romance Scam',
    contactName: 'Dr. Robert',
    icon: Heart,
    messages: [
      { id: 1, sender: 'scammer', text: 'Good morning beautiful! I wish I was there with you instead of this oil rig.', delay: 0 },
      { id: 2, sender: 'scammer', text: 'Our connection is so special. I feel like I’ve known you forever.', delay: 2000 },
      { id: 3, sender: 'scammer', text: 'Something terrible happened with the equipment today.', delay: 4500 },
      { id: 4, sender: 'scammer', text: 'I need $2000 to fix it so I can come home to you. Can you wire it?', delay: 7000 },
    ],
    finalAnalysis: {
      probability: 90,
      flags: ['Love bombing', 'Remote location excuse', 'Sudden financial crisis', 'Wire transfer request'],
      technique: 'Romance Scam (Pig Butchering)',
      explanation: 'Builds emotional trust over time before manufacturing a crisis that requires financial "help".',
      recommendation: 'Stop all contact. Never send money to someone you have not met in person.'
    }
  },
  {
    id: 'tech',
    title: 'Tech Support',
    contactName: 'Microsoft-Support',
    icon: Monitor,
    messages: [
      { id: 1, sender: 'scammer', text: 'Security Warning: We detected a Trojan Virus on your computer.', delay: 0 },
      { id: 2, sender: 'scammer', text: 'Your personal data and banking info is at risk.', delay: 2000 },
      { id: 3, sender: 'scammer', text: 'Please call Microsoft Certified Technicians immediately at 1-800-555-0122.', delay: 4000 },
    ],
    finalAnalysis: {
      probability: 97,
      flags: ['Fear appeal', 'Impersonating major tech company', 'Demanding phone call'],
      technique: 'Tech Support Fraud',
      explanation: 'Tech companies never contact you unsolicited to tell you about a virus. They want remote access to your PC.',
      recommendation: 'Ignore the message. Run a scan with your own antivirus software.'
    }
  },
  {
    id: 'irs',
    title: 'IRS/Gov Scam',
    contactName: 'IRS-Official',
    icon: Scale,
    messages: [
      { id: 1, sender: 'scammer', text: 'Final Notice: IRS Case #847291 regarding your tax filings.', delay: 0 },
      { id: 2, sender: 'scammer', text: 'You owe $4,832 in back taxes. This is your final warning.', delay: 2000 },
      { id: 3, sender: 'scammer', text: 'A warrant for your arrest will be issued if payment is not made today.', delay: 4500 },
    ],
    finalAnalysis: {
      probability: 99,
      flags: ['Threat of arrest', 'High dollar amount', 'Extreme urgency'],
      technique: 'Government Impersonation',
      explanation: 'The IRS never initiates contact via text message and never threatens immediate arrest.',
      recommendation: 'Do not respond. Contact the IRS directly via their official .gov website if you are concerned.'
    }
  }
];

// --- CONTENT DATABASE ---

const RAW_TWITTER_POSTS = [
  {
    id: "tw1",
    platform: "twitter",
    author: "GameDayUpdate",
    handle: "@Sports_Central",
    verified: true,
    timestamp: "10m",
    content: "Great game last night! Both teams played their hearts out. Can't wait for the playoffs! 🏀",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 12400,
    retweets: 120,
    comments: 45
  },
  {
    id: "tw2",
    platform: "twitter",
    author: "CityWeather",
    handle: "@Metro_Forecast",
    verified: true,
    timestamp: "1h",
    content: "Sunny skies this weekend! Perfect for a picnic. 🌤️ Highs in the 70s.",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 400,
    retweets: 50,
    comments: 12
  },
  {
    id: "tw3",
    platform: "twitter",
    author: "FreedomFighter",
    handle: "@WakeUp_Now",
    verified: false,
    timestamp: "3h",
    originalContent: "These ILLEGALS are DESTROYING our country! If you don't see it you're part of the problem. Share before they delete this!",
    neutralizedContent: "This account believes immigration policies should be stricter and expresses concern about current border policies.",
    isManipulative: true,
    severityScore: 9,
    techniques: ["Scapegoating", "Dehumanization", "False Urgency"],
    likes: 8700,
    retweets: 4200,
    comments: 2300,
    category: 'Political Division'
  },
  {
    id: "tw4",
    platform: "twitter",
    author: "TruthDoctor",
    handle: "@HealthRevealed",
    verified: false,
    timestamp: "2h",
    originalContent: "Big Pharma doesn't want you to know this ONE trick that cures inflammation. exposed exposed exposed! 🧵",
    neutralizedContent: "This account claims to have health information about inflammation. Medical claims should be verified with healthcare professionals.",
    isManipulative: true,
    severityScore: 7,
    techniques: ["Conspiracy Framing", "False Authority", "Clickbait"],
    likes: 3200,
    retweets: 890,
    comments: 456,
    category: 'Health Misinformation'
  },
  {
    id: "tw5",
    platform: "twitter",
    author: "TechInsider",
    handle: "@Dev_News",
    verified: true,
    timestamp: "30m",
    content: "The new framework update is causing some issues with legacy code. Read the migration guide before upgrading.",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 2100,
    retweets: 500,
    comments: 150
  },
  {
    id: "tw6",
    platform: "twitter",
    author: "CryptoKing",
    handle: "@Moon_Soon",
    verified: false,
    timestamp: "15m",
    originalContent: "🚨 LAST CHANCE 🚨 This coin is about to 1000x. Everyone who missed Bitcoin is buying NOW. Don't be the idiot who waits!",
    neutralizedContent: "This account is promoting a cryptocurrency investment and believes the price will increase. Investment carries risk and past performance doesn't guarantee results.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["False Urgency", "FOMO", "Shame"],
    likes: 1200,
    retweets: 890,
    comments: 234,
    category: 'Financial Scams'
  },
  {
    id: "tw7",
    platform: "twitter",
    author: "LocalLibrary",
    handle: "@PublicLibrary",
    verified: true,
    timestamp: "4h",
    content: "Summer reading program starts next week! Sign up at the front desk. All ages welcome. 📚",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 234,
    retweets: 45,
    comments: 23
  },
  {
    id: "tw8",
    platform: "twitter",
    author: "FitLifeCoach",
    handle: "@NoExcuses_Fit",
    verified: false,
    timestamp: "5h",
    originalContent: "Summer is 12 weeks away. If you're not already in the gym, you've already failed. Your body is your fault. No excuses.",
    neutralizedContent: "This account believes physical fitness is important and encourages exercise. People have different fitness goals and timelines that work for them.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Shame/Guilt", "False Deadline", "Black-and-White"],
    likes: 5600,
    retweets: 1200,
    comments: 890,
    category: 'Body Image'
  },
  {
    id: "tw9",
    platform: "twitter",
    author: "MindsetGuru",
    handle: "@Success_Daily",
    verified: true,
    timestamp: "6h",
    originalContent: "Poor people watch TV. Rich people read books. It's that simple. Which one are you? 🤔",
    neutralizedContent: "This account believes reading habits correlate with financial success. Many factors contribute to financial outcomes, and people consume media in different ways.",
    isManipulative: true,
    severityScore: 6,
    techniques: ["False Dichotomy", "Shame", "Oversimplification"],
    likes: 34000,
    retweets: 8900,
    comments: 2300,
    category: 'Financial Scams'
  },
  {
    id: "tw10",
    platform: "twitter",
    author: "RecipeShare",
    handle: "@HomeCooking",
    verified: false,
    timestamp: "8h",
    content: "Made grandma's chicken soup recipe today. Nothing beats homemade comfort food on a cold day! 🍲",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 1200,
    retweets: 89,
    comments: 45
  }
];

const RAW_TIKTOK_POSTS = [
  {
    id: "tt1",
    platform: "tiktok",
    author: "recipequeen",
    handle: "@cooking_easy",
    verified: true,
    timestamp: "2h",
    content: "5-minute pasta recipe! Perfect for busy weeknights 🍝 Ingredients in comments!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 45000,
    comments: 1200,
    shares: 3400
  },
  {
    id: "tt2",
    platform: "tiktok",
    author: "skinnycheck",
    handle: "@body_goals",
    verified: false,
    timestamp: "6h",
    originalContent: "POV: You finally fit into your skinny jeans after not eating for a week 💅 Worth it bestie",
    neutralizedContent: "This creator shares their experience with dieting. Health professionals recommend sustainable eating habits rather than restrictive diets.",
    isManipulative: true,
    severityScore: 9,
    techniques: ["Normalizing Harm", "Pro-ED Content", "False Achievement"],
    likes: 89000,
    comments: 4500,
    shares: 2300,
    category: 'Body Image'
  },
  {
    id: "tt3",
    platform: "tiktok",
    author: "positivevibesonly",
    handle: "@good_vibes",
    verified: false,
    timestamp: "1d",
    originalContent: "Depression is a choice. Wake up earlier. Touch grass. I fixed myself in 2 weeks. Stop being lazy.",
    neutralizedContent: "This creator shares their personal experience and believes lifestyle changes helped them. Mental health experiences vary widely, and professional support can be helpful.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Dismissal", "Oversimplification", "Shame"],
    likes: 34000,
    comments: 8900,
    shares: 1200,
    category: 'Mental Health'
  },
  {
    id: "tt4",
    platform: "tiktok",
    author: "puppylove",
    handle: "@daily_dogs",
    verified: false,
    timestamp: "4h",
    content: "My golden retriever learning to shake hands 🐕 She's 8 months old!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 120000,
    comments: 3400,
    shares: 5600
  },
  {
    id: "tt5",
    platform: "tiktok",
    author: "truthseeker",
    handle: "@they_hide_this",
    verified: false,
    timestamp: "8h",
    originalContent: "The government is putting stuff in the water to make you tired. Why do you think everyone's exhausted? EXPOSED 🧵",
    neutralizedContent: "This creator believes there are concerns about water quality. Water safety information is available from local health departments.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Conspiracy Framing", "Fear Appeal", "Vague Evidence"],
    likes: 67000,
    comments: 12000,
    shares: 8900,
    category: 'Conspiracy'
  },
  {
    id: "tt6",
    platform: "tiktok",
    author: "studytok",
    handle: "@college_tips",
    verified: true,
    timestamp: "12h",
    content: "Pomodoro technique changed my life! 25 min focus, 5 min break. Try it for finals week 📚",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 23000,
    comments: 890,
    shares: 2300
  },
  {
    id: "tt7",
    platform: "tiktok",
    author: "organicmama",
    handle: "@clean_parent",
    verified: false,
    timestamp: "1d",
    originalContent: "If you feed your kids processed food you don't actually love them 🤷‍♀️ Real moms make everything from scratch",
    neutralizedContent: "This creator believes homemade food is preferable for children. Parents make different choices based on their circumstances and resources.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Shame/Guilt", "Gatekeeping", "Black-and-White"],
    likes: 45000,
    comments: 9800,
    shares: 3400,
    category: 'Parenting Shame'
  },
  {
    id: "tt8",
    platform: "tiktok",
    author: "moneyboss",
    handle: "@rich_at_19",
    verified: false,
    timestamp: "3h",
    originalContent: "I make $50k/month from my laptop. You're still working a 9-5 like a sheep? DM me 'FREEDOM' 🐑",
    neutralizedContent: "This creator claims to earn money online and offers to share their methods. Income claims should be verified, and most opportunities require significant effort or carry risk.",
    isManipulative: true,
    severityScore: 9,
    techniques: ["Unverified Claims", "Shame", "FOMO"],
    likes: 34000,
    comments: 5600,
    shares: 2100,
    category: 'Financial Scams'
  },
  {
    id: "tt9",
    platform: "tiktok",
    author: "artistlife",
    handle: "@creative_corner",
    verified: true,
    timestamp: "5h",
    content: "Painting a sunset with only 3 colors 🎨 Comment which colors you'd use!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 56000,
    comments: 2300,
    shares: 890
  },
  {
    id: "tt10",
    platform: "tiktok",
    author: "relationshiptok",
    handle: "@dating_advice",
    verified: false,
    timestamp: "7h",
    originalContent: "If he takes more than 10 minutes to text back, he doesn't love you sis. Know your worth. Red flag 🚩🚩🚩",
    neutralizedContent: "This creator shares dating opinions and believes response time indicates interest. People have different communication styles and schedules.",
    isManipulative: true,
    severityScore: 6,
    techniques: ["False Equivalence", "Insecurity Exploitation", "Absolutism"],
    likes: 78000,
    comments: 12000,
    shares: 4500,
    category: 'Mental Health'
  }
];

const RAW_INSTAGRAM_POSTS = [
  {
    id: "ig1",
    platform: "instagram",
    author: "travelphotography",
    handle: "@world_captures",
    verified: true,
    timestamp: "6h",
    content: "Sunset in Santorini 🌅 Taken last summer. What's your favorite travel destination?",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 89000,
    comments: 1200
  },
  {
    id: "ig2",
    platform: "instagram",
    author: "fitfluencer",
    handle: "@beach_body_now",
    verified: true,
    timestamp: "1d",
    originalContent: "I used to look like the left pic. Disgusting. Now I wake up at 4am daily. What's YOUR excuse? Stop being lazy. Link in bio for my program 💪",
    neutralizedContent: "This creator shares their fitness journey and offers a program. Body changes happen differently for everyone, and there are many valid approaches to health.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Before/After Shame", "Self-Deprecation Weapon", "Guilt"],
    likes: 67000,
    comments: 3400,
    category: 'Body Image'
  },
  {
    id: "ig3",
    platform: "instagram",
    author: "plantparent",
    handle: "@urban_jungle",
    verified: false,
    timestamp: "2h",
    content: "New monstera leaf unfurling! 🌿 Three months of patience finally paying off.",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 12000,
    comments: 234
  },
  {
    id: "ig4",
    platform: "instagram",
    author: "relationshipcoach",
    handle: "@love_rules",
    verified: false,
    timestamp: "8h",
    originalContent: "If your partner doesn't post you, they're hiding you. Period. A real man shows off his woman. Know your worth queen 👑",
    neutralizedContent: "This account shares relationship opinions and believes social media visibility indicates commitment. People express love differently, and posting habits vary.",
    isManipulative: true,
    severityScore: 7,
    techniques: ["Insecurity Exploitation", "False Equivalence", "Gatekeeping"],
    likes: 156000,
    comments: 8900,
    category: 'Mental Health'
  },
  {
    id: "ig5",
    platform: "instagram",
    author: "coffeeart",
    handle: "@barista_life",
    verified: false,
    timestamp: "1h",
    content: "Trying a new latte art design ☕ Still practicing but getting better!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 4500,
    comments: 120
  },
  {
    id: "ig6",
    platform: "instagram",
    author: "beautystandards",
    handle: "@glow_up_now",
    verified: true,
    timestamp: "12h",
    originalContent: "You're NOT ugly, you're just poor 💅 These treatments changed my life. If you can't afford them you'll never compete. Link in bio.",
    neutralizedContent: "This account promotes beauty treatments and products. Appearance doesn't determine worth, and people have value regardless of beauty spending.",
    isManipulative: true,
    severityScore: 9,
    techniques: ["Shame", "Classism", "Insecurity Attack"],
    likes: 78000,
    comments: 4500,
    category: 'Body Image'
  },
  {
    id: "ig7",
    platform: "instagram",
    author: "bookclub",
    handle: "@reading_corner",
    verified: true,
    timestamp: "5h",
    content: "This month's pick: 'Tomorrow, and Tomorrow, and Tomorrow' 📖 Who's joining us for discussion?",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 2300,
    comments: 156
  },
  {
    id: "ig8",
    platform: "instagram",
    author: "hustleking",
    handle: "@grind_never_stops",
    verified: true,
    timestamp: "2d",
    originalContent: "While you were sleeping, I was working. While you were partying, I was building. In 5 years you'll work FOR me 💰",
    neutralizedContent: "This account believes intensive work habits lead to success. Work-life balance varies for different people, and success can be defined many ways.",
    isManipulative: true,
    severityScore: 7,
    techniques: ["Superiority", "Shame", "Hustle Culture"],
    likes: 234000,
    comments: 12000,
    category: 'Financial Scams'
  },
  {
    id: "ig9",
    platform: "instagram",
    author: "foodphotography",
    handle: "@tasty_shots",
    verified: false,
    timestamp: "3h",
    content: "Homemade ramen from scratch 🍜 Recipe took 8 hours but so worth it!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 34000,
    comments: 890
  },
  {
    id: "ig10",
    platform: "instagram",
    author: "anxietycoach",
    handle: "@just_breathe",
    verified: false,
    timestamp: "10h",
    originalContent: "Anxiety is just weakness leaving the body. Stop making excuses. I cured mine by just deciding to be happy. You can too if you actually tried.",
    neutralizedContent: "This creator shares their personal mental health experience. Anxiety disorders are medical conditions, and treatment approaches vary. Professional support can help.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Dismissal", "Oversimplification", "Shame"],
    likes: 45000,
    comments: 6700,
    category: 'Mental Health'
  }
];

const RAW_FACEBOOK_POSTS = [
  {
    id: "fb1",
    platform: "facebook",
    author: "Community Events",
    handle: "Neighborhood Watch",
    timestamp: "2h",
    content: "Reminder: Town hall meeting Thursday at 7pm. Discussing new playground equipment. All welcome!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 45,
    comments: 12,
    shares: 8
  },
  {
    id: "fb2",
    platform: "facebook",
    author: "PatriotNews",
    handle: "Real American Truth",
    timestamp: "4h",
    originalContent: "They're coming for your children. They're coming for your guns. They're coming for your freedom. WAKE UP before it's too late! Share if you're a TRUE American! 🇺🇸",
    neutralizedContent: "This page expresses concerns about certain political policies regarding families, gun rights, and freedoms. These are political opinions that people debate.",
    isManipulative: true,
    severityScore: 9,
    techniques: ["Fear Appeal", "Vague Threat", "In-group Signaling", "Urgency"],
    likes: 12000,
    comments: 3400,
    shares: 5600,
    category: 'Political Division'
  },
  {
    id: "fb3",
    platform: "facebook",
    author: "Sarah Mitchell",
    handle: "Personal",
    timestamp: "6h",
    content: "So proud of my daughter for graduating with honors! 🎓 Celebration dinner tonight!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 234,
    comments: 45,
    shares: 2
  },
  {
    id: "fb4",
    platform: "facebook",
    author: "Natural Healing",
    handle: "Wellness Warriors",
    timestamp: "1d",
    originalContent: "exposed exposed exposed ARE POISON. exposed exposed exposed exposed exposed! Your doctor won't tell you because they PROFIT from your sickness! exposed exposed exposed",
    neutralizedContent: "This page promotes alternative health views and expresses skepticism about conventional medicine. Medical decisions should involve consulting qualified healthcare professionals.",
    isManipulative: true,
    severityScore: 9,
    techniques: ["Conspiracy Framing", "Fear", "Anti-Authority"],
    likes: 8900,
    comments: 2300,
    shares: 4500,
    category: 'Health Misinformation'
  },
  {
    id: "fb5",
    platform: "facebook",
    author: "Mario's Kitchen",
    handle: "Local Restaurant",
    timestamp: "3h",
    content: "Happy hour special: Half-price appetizers 4-6pm! 🍕 See you there!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 67,
    comments: 8,
    shares: 3
  },
  {
    id: "fb6",
    platform: "facebook",
    author: "Miracle Cures",
    handle: "Senior Health Tips",
    timestamp: "8h",
    originalContent: "Doctors HATE this simple trick that eliminates joint pain INSTANTLY. exposed exposed exposed exposed! Click before they take this down!",
    neutralizedContent: "This page claims to offer health solutions for joint pain. Medical treatments should be discussed with healthcare providers. Claims of instant cures should be verified.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["False Authority", "Urgency", "Clickbait", "Elderly Targeting"],
    likes: 3400,
    comments: 890,
    shares: 2100,
    category: 'Health Misinformation'
  },
  {
    id: "fb7",
    platform: "facebook",
    author: "Second Chance Rescue",
    handle: "Pet Adoption",
    timestamp: "5h",
    content: "Meet Buddy! 🐕 This sweet 3-year-old lab needs a forever home. Great with kids!",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 456,
    comments: 78,
    shares: 89
  },
  {
    id: "fb8",
    platform: "facebook",
    author: "Political Divide",
    handle: "Unfiltered Truth",
    timestamp: "12h",
    originalContent: "If you still support [political figure], unfriend me NOW. I don't associate with evil. You're either with us or against us. No middle ground.",
    neutralizedContent: "This person has strong political views and expresses frustration with those who disagree. Political opinions vary and people can have genuine disagreements.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Black-and-White", "Dehumanization", "Ultimatum"],
    likes: 5600,
    comments: 1200,
    shares: 890,
    category: 'Political Division'
  },
  {
    id: "fb9",
    platform: "facebook",
    author: "Local Garden Club",
    handle: "Green Thumbs",
    timestamp: "1d",
    content: "Spring planting workshop this Saturday! Learn about native species for your garden. Free for members 🌻",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    likes: 123,
    comments: 34,
    shares: 23
  },
  {
    id: "fb10",
    platform: "facebook",
    author: "Worried Grandma",
    handle: "Family Safety",
    timestamp: "9h",
    originalContent: "EXPOSED!!! exposed exposed exposed exposed! Your grandchildren are in DANGER every day. Schools are HIDING this. Share before Facebook deletes! 😱",
    neutralizedContent: "This post expresses safety concerns about schools. Specific claims should be verified with school administrators and official sources.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Fear Appeal", "Vague Threat", "False Urgency", "Conspiracy"],
    likes: 2300,
    comments: 890,
    shares: 1200,
    category: 'Conspiracy'
  }
];

const RAW_YOUTUBE_POSTS = [
  {
    id: "yt1",
    platform: "youtube",
    author: "Cooking With Marco",
    handle: "@marcoskitchen",
    verified: true,
    timestamp: "2 days ago",
    content: "How to make authentic carbonara in 15 minutes | No cream, traditional recipe",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    views: 234000,
    likes: 12000
  },
  {
    id: "yt2",
    platform: "youtube",
    author: "Hidden Knowledge",
    handle: "@truth_revealed",
    verified: false,
    timestamp: "1 week ago",
    originalContent: "What They DON'T Want You to Know | exposed exposed exposed | Watch Before DELETED!!!",
    neutralizedContent: "This video claims to reveal hidden information. The creator believes there is suppressed knowledge. Claims should be verified with reliable sources.",
    isManipulative: true,
    severityScore: 7,
    techniques: ["Conspiracy Framing", "False Urgency", "Clickbait"],
    views: 890000,
    likes: 45000,
    category: 'Conspiracy'
  },
  {
    id: "yt3",
    platform: "youtube",
    author: "Science Explained",
    handle: "@scienceclear",
    verified: true,
    timestamp: "5 days ago",
    content: "How do black holes actually work? | Simple explanation with animations",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    views: 567000,
    likes: 34000
  },
  {
    id: "yt4",
    platform: "youtube",
    author: "Wealth Academy",
    handle: "@rich_fast",
    verified: true,
    timestamp: "3 days ago",
    originalContent: "I Made $100K in 30 Days With ONE Strategy | exposed exposed exposed | FREE Course (Limited Spots!)",
    neutralizedContent: "This video promotes a money-making strategy and offers a course. Income claims should be verified, and most strategies require significant effort or carry risk.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Unverified Claims", "False Scarcity", "FOMO"],
    views: 1200000,
    likes: 23000,
    category: 'Financial Scams'
  },
  {
    id: "yt5",
    platform: "youtube",
    author: "Home Repair 101",
    handle: "@diy_fixes",
    verified: true,
    timestamp: "1 week ago",
    content: "How to fix a leaky faucet | Step by step guide for beginners",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    views: 123000,
    likes: 8900
  },
  {
    id: "yt6",
    platform: "youtube",
    author: "Outrage Daily",
    handle: "@reaction_central",
    verified: true,
    timestamp: "2 days ago",
    originalContent: "This Person Said WHAT?! | You Won't BELIEVE What Happened | I'm DONE 😤",
    neutralizedContent: "This video shares the creator's reaction to someone else's statements. The creator expresses strong disagreement and wants to share their perspective.",
    isManipulative: true,
    severityScore: 6,
    techniques: ["Ragebait", "Clickbait", "Emotional Manipulation"],
    views: 2300000,
    likes: 67000,
    category: 'Political Division'
  },
  {
    id: "yt7",
    platform: "youtube",
    author: "Music Theory",
    handle: "@learn_music",
    verified: true,
    timestamp: "4 days ago",
    content: "Why some songs sound happy and others sad | Understanding chord progressions",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    views: 89000,
    likes: 5600
  },
  {
    id: "yt8",
    platform: "youtube",
    author: "Doomsday Prep",
    handle: "@survive_collapse",
    verified: false,
    timestamp: "6 days ago",
    originalContent: "The Collapse is Coming SOONER Than You Think | 5 Things You NEED Before It's Too Late | Don't Say I Didn't Warn You",
    neutralizedContent: "This video discusses emergency preparedness from the perspective that major disruption is likely. The creator recommends preparing for emergencies.",
    isManipulative: true,
    severityScore: 8,
    techniques: ["Fear Appeal", "Urgency", "Doom Framing"],
    views: 456000,
    likes: 23000,
    category: 'Conspiracy'
  },
  {
    id: "yt9",
    platform: "youtube",
    author: "Chill Beats",
    handle: "@lofi_study",
    verified: true,
    timestamp: "1 month ago",
    content: "Lofi hip hop beats to study/relax to | 3 hour mix 🎵",
    isManipulative: false,
    severityScore: 0,
    techniques: [],
    views: 4500000,
    likes: 89000
  },
  {
    id: "yt10",
    platform: "youtube",
    author: "Drama Alert",
    handle: "@celebrity_exposed",
    verified: false,
    timestamp: "1 day ago",
    originalContent: "[Celebrity] CANCELLED! Fans Are FURIOUS! Career OVER?! 😱🔥",
    neutralizedContent: "This video discusses controversy involving a public figure. The creator presents their interpretation of events. Multiple perspectives may exist.",
    isManipulative: true,
    severityScore: 6,
    techniques: ["Sensationalism", "Clickbait", "Outrage Farming"],
    views: 1800000,
    likes: 45000,
    category: 'Political Division'
  }
];

// Helper to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

const getRandomColor = () => {
    const colors = ['bg-red-500/20', 'bg-blue-500/20', 'bg-green-500/20', 'bg-purple-500/20', 'bg-pink-500/20', 'bg-indigo-500/20'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Convert raw data to app's Post interface
export const SAMPLE_POSTS: Post[] = [
  ...RAW_TWITTER_POSTS.map(p => ({
    id: p.id,
    platform: 'twitter' as const,
    category: (p.category as PostCategory) || 'Clean Content',
    original: p.originalContent || p.content || "",
    neutralized: p.neutralizedContent || p.content || "",
    techniques: p.techniques,
    severity: p.severityScore,
    author: p.author,
    handle: p.handle,
    timestamp: p.timestamp,
    verified: p.verified,
    likes: formatNumber(p.likes),
    comments: formatNumber(p.comments),
    shares: formatNumber(p.retweets || 0),
    hasMedia: false,
    commentThread: []
  })),
  ...RAW_TIKTOK_POSTS.map(p => ({
    id: p.id,
    platform: 'tiktok' as const,
    category: (p.category as PostCategory) || 'Clean Content',
    original: p.originalContent || p.content || "",
    neutralized: p.neutralizedContent || p.content || "",
    techniques: p.techniques,
    severity: p.severityScore,
    author: p.author,
    handle: p.handle,
    timestamp: p.timestamp,
    verified: p.verified,
    likes: formatNumber(p.likes),
    comments: formatNumber(p.comments),
    shares: formatNumber(p.shares || 0),
    hasMedia: true,
    mediaType: 'video' as const,
    mediaColor: getRandomColor(),
    commentThread: []
  })),
  ...RAW_INSTAGRAM_POSTS.map(p => ({
    id: p.id,
    platform: 'instagram' as const,
    category: (p.category as PostCategory) || 'Clean Content',
    original: p.originalContent || p.content || "",
    neutralized: p.neutralizedContent || p.content || "",
    techniques: p.techniques,
    severity: p.severityScore,
    author: p.author,
    handle: p.handle,
    timestamp: p.timestamp,
    verified: p.verified,
    likes: formatNumber(p.likes),
    comments: formatNumber(p.comments),
    shares: "0",
    hasMedia: true,
    mediaType: 'image' as const,
    mediaColor: getRandomColor(),
    commentThread: []
  })),
  ...RAW_FACEBOOK_POSTS.map(p => ({
    id: p.id,
    platform: 'facebook' as const,
    category: (p.category as PostCategory) || 'Clean Content',
    original: p.originalContent || p.content || "",
    neutralized: p.neutralizedContent || p.content || "",
    techniques: p.techniques,
    severity: p.severityScore,
    author: p.author,
    handle: p.handle,
    timestamp: p.timestamp,
    verified: false,
    likes: formatNumber(p.likes),
    comments: formatNumber(p.comments),
    shares: formatNumber(p.shares),
    hasMedia: false,
    commentThread: []
  })),
  ...RAW_YOUTUBE_POSTS.map(p => ({
    id: p.id,
    platform: 'youtube' as const,
    category: (p.category as PostCategory) || 'Clean Content',
    original: p.originalContent || p.content || "",
    neutralized: p.neutralizedContent || p.content || "",
    techniques: p.techniques,
    severity: p.severityScore,
    author: p.author,
    handle: p.handle,
    timestamp: p.timestamp,
    verified: p.verified,
    likes: formatNumber(p.likes),
    comments: "0",
    shares: "0",
    views: formatNumber(p.views),
    hasMedia: true,
    mediaType: 'video' as const,
    mediaColor: getRandomColor(),
    commentThread: []
  }))
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

export const ANALYSIS_EXAMPLES: Record<string, string[]> = {
  "Health Misinfo": [
    "Doctors are LYING to you about this simple fruit that CURES cancer!!!",
    "EXPOSED: Vaccines contain microchips for government tracking!!! EXPOSED!!!",
    "Big Pharma doesn't want you to know this ONE trick that eliminates all disease!!!"
  ],
  "Financial Scams": [
    "I turned $100 into $10,000 in ONE day with this crypto secret. DM me NOW to learn how!",
    "Banks are collapsing! Move your money to GoldCoin before it's too late! 🚨",
    "Passive income is easy. Stop working for a boss and join my team today!"
  ],
  "Body Image": [
    "If you don't have a thigh gap, you need to work harder. No excuses.",
    "Real men have muscles. If you're skinny, you're weak.",
    "Lose 20lbs in 1 week with this tea! Results guaranteed!"
  ]
};
