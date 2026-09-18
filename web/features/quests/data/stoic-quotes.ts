export type StoicQuoteCategory = "philosopher" | "conor-mcgregor" | "mathematician";

export interface StoicQuote {
  id: string;
  text: string;
  author: string;
  category: StoicQuoteCategory;
}

export const STOIC_QUOTES: readonly StoicQuote[] = [
  // --- Philosophers ---
  {
    id: "phil-1",
    text: "At dawn, when you have trouble getting out of bed, tell yourself: ‘I have to go to work — as a human being.’",
    author: "Marcus Aurelius",
    category: "philosopher",
  },
  {
    id: "phil-2",
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
    category: "philosopher",
  },
  {
    id: "phil-3",
    text: "You have power over your mind — not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    category: "philosopher",
  },
  {
    id: "phil-4",
    text: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius",
    category: "philosopher",
  },
  {
    id: "phil-5",
    text: "Confine yourself to the present.",
    author: "Marcus Aurelius",
    category: "philosopher",
  },
  {
    id: "phil-6",
    text: "Never let the future disturb you. You will meet it with the same weapons of reason which today arm you against the present.",
    author: "Marcus Aurelius",
    category: "philosopher",
  },
  {
    id: "phil-7",
    text: "Difficulties strengthen the mind, as labor does the body.",
    author: "Seneca",
    category: "philosopher",
  },
  {
    id: "phil-8",
    text: "We suffer more often in imagination than in reality.",
    author: "Seneca",
    category: "philosopher",
  },
  {
    id: "phil-9",
    text: "No man was ever wise by chance.",
    author: "Seneca",
    category: "philosopher",
  },
  {
    id: "phil-10",
    text: "A gem cannot be polished without friction, nor a man perfected without trials.",
    author: "Seneca",
    category: "philosopher",
  },
  {
    id: "phil-11",
    text: "It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.",
    author: "Seneca",
    category: "philosopher",
  },
  {
    id: "phil-12",
    text: "First say to yourself what you would be; and then do what you have to do.",
    author: "Epictetus",
    category: "philosopher",
  },
  {
    id: "phil-13",
    text: "Difficulty shows what men are.",
    author: "Epictetus",
    category: "philosopher",
  },
  {
    id: "phil-14",
    text: "No great thing is created suddenly.",
    author: "Epictetus",
    category: "philosopher",
  },
  {
    id: "phil-15",
    text: "Demand not that events happen as you wish, but wish them to happen as they do happen.",
    author: "Epictetus",
    category: "philosopher",
  },
  {
    id: "phil-16",
    text: "Curb your desire — don't set your heart on so many things and you will get what you need.",
    author: "Epictetus",
    category: "philosopher",
  },
  {
    id: "phil-17",
    text: "The struggle itself toward the heights is enough to fill a man's heart. One must imagine Sisyphus happy.",
    author: "Albert Camus",
    category: "philosopher",
  },
  {
    id: "phil-18",
    text: "In the depth of winter, I finally learned that within me there lay an invincible summer.",
    author: "Albert Camus",
    category: "philosopher",
  },
  {
    id: "phil-19",
    text: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    category: "philosopher",
  },
  {
    id: "phil-20",
    text: "To live is to suffer, to survive is to find some meaning in the suffering.",
    author: "Friedrich Nietzsche",
    category: "philosopher",
  },
  {
    id: "phil-21",
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    category: "philosopher",
  },
  {
    id: "phil-22",
    text: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle",
    category: "philosopher",
  },
  {
    id: "phil-23",
    text: "Employ your time in improving yourself by other men's writings so that you shall come easily by what others have labored hard for.",
    author: "Socrates",
    category: "philosopher",
  },

  // --- Conor McGregor ---
  {
    id: "cm-1",
    text: "There's no talent here, this is hard work. This is an obsession. Talent does not exist, we are all equals as human beings.",
    author: "Conor McGregor",
    category: "conor-mcgregor",
  },
  {
    id: "cm-2",
    text: "Doubt is only removed by action. If you're not working then that's where doubt comes in.",
    author: "Conor McGregor",
    category: "conor-mcgregor",
  },
  {
    id: "cm-3",
    text: "I take the good with the bad, but I stay neutral to both. I don't get too high and I don't get too low.",
    author: "Conor McGregor",
    category: "conor-mcgregor",
  },
  {
    id: "cm-4",
    text: "The more you seek the uncomfortable, the more you will become comfortable.",
    author: "Conor McGregor",
    category: "conor-mcgregor",
  },
  {
    id: "cm-5",
    text: "Excellence is not a skill. Excellence is an attitude.",
    author: "Conor McGregor",
    category: "conor-mcgregor",
  },
  {
    id: "cm-6",
    text: "Nothing good comes easy. You have to be willing to endure.",
    author: "Conor McGregor",
    category: "conor-mcgregor",
  },
  {
    id: "cm-7",
    text: "Keep your head down and do the work.",
    author: "Conor McGregor",
    category: "conor-mcgregor",
  },
  {
    id: "cm-8",
    text: "It is not about talent, it is about discipline and showing up when you do not want to.",
    author: "Conor McGregor",
    category: "conor-mcgregor",
  },

  // --- Mathematicians ---
  {
    id: "math-1",
    text: "The work of the mathematician is not to triumph over difficulty, but to dissolve it through patience and attentiveness.",
    author: "Alexander Grothendieck",
    category: "mathematician",
  },
  {
    id: "math-2",
    text: "The sea advances insensibly and quietly, nothing seems to happen, yet in time the hardest rock is turned to sand.",
    author: "Alexander Grothendieck",
    category: "mathematician",
  },
  {
    id: "math-3",
    text: "It is not knowledge, but the act of learning, which grants the greatest enjoyment.",
    author: "Carl Friedrich Gauss",
    category: "mathematician",
  },
  {
    id: "math-4",
    text: "I have had my results for a long time: but I do not yet know how I am to arrive at them.",
    author: "Carl Friedrich Gauss",
    category: "mathematician",
  },
  {
    id: "math-5",
    text: "Thought is only a flash between two long nights, but this flash is everything.",
    author: "Henri Poincaré",
    category: "mathematician",
  },
  {
    id: "math-6",
    text: "It is by logic that we prove, but by intuition that we discover.",
    author: "Henri Poincaré",
    category: "mathematician",
  },
  {
    id: "math-7",
    text: "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
    author: "Alan Turing",
    category: "mathematician",
  },
  {
    id: "math-8",
    text: "We must know. We will know.",
    author: "David Hilbert",
    category: "mathematician",
  },
  {
    id: "math-9",
    text: "There is no royal road to geometry.",
    author: "Euclid",
    category: "mathematician",
  },
  {
    id: "math-10",
    text: "In mathematics you don't understand things. You just get used to them.",
    author: "John von Neumann",
    category: "mathematician",
  },
  {
    id: "math-11",
    text: "All of humanity's problems stem from man's inability to sit quietly in a room alone.",
    author: "Blaise Pascal",
    category: "mathematician",
  },
  {
    id: "math-12",
    text: "You don't have to believe in God, but you should believe in The Book.",
    author: "Paul Erdős",
    category: "mathematician",
  },
];

/**
 * Deterministically returns a quote for a given date string (e.g. "YYYY-MM-DD").
 * Safe for SSR hydration matching.
 */
export function getDailyStoicQuote(dateKey?: string): StoicQuote {
  const key = dateKey || "2026-09-18";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % STOIC_QUOTES.length;
  return STOIC_QUOTES[index];
}

/**
 * Returns a random quote different from the current one.
 */
export function getNextStoicQuote(currentId?: string): StoicQuote {
  const pool = STOIC_QUOTES.filter((q) => q.id !== currentId);
  const nextIndex = Math.floor(Math.random() * pool.length);
  return pool[nextIndex] || STOIC_QUOTES[0];
}
