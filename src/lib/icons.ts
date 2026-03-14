// Available icons for chores and rewards

export const choreIcons: Record<string, string> = {
  sparkles: "Sparkles",
  bed: "Bed",
  dishes: "Dishes",
  broom: "Broom",
  laundry: "Laundry",
  dog: "Dog",
  cat: "Cat",
  trash: "Trash",
  book: "Book",
  tooth: "Tooth",
  bath: "Bath",
  homework: "Homework",
  garden: "Garden",
  vacuum: "Vacuum",
  cook: "Cook",
  tidy: "Tidy",
  mop: "Mop",
  sponge: "Sponge",
  grocery: "Grocery",
  recycle: "Recycle",
  water: "Water",
  fold: "Fold",
  shoes: "Shoes",
  feed: "Feed",
  window: "Window",
  car: "Car",
  mail: "Mail",
  organize: "Organize",
  plant: "Plant",
  music: "Music",
};

export const rewardIcons: Record<string, string> = {
  gift: "Gift",
  icecream: "Ice Cream",
  movie: "Movie",
  game: "Game",
  park: "Park",
  toy: "Toy",
  pizza: "Pizza",
  sleepover: "Sleepover",
  swimming: "Swimming",
  bike: "Bike",
  tablet: "Tablet",
  treat: "Treat",
  candy: "Candy",
  star: "Star",
  reading: "Reading",
  music: "Music",
  camp: "Camp",
  art: "Art",
  dance: "Dance",
  zoo: "Zoo",
};

export const avatars = [
  { id: "bear", emoji: "🐻", label: "Bear" },
  { id: "cat", emoji: "🐱", label: "Cat" },
  { id: "dog", emoji: "🐶", label: "Dog" },
  { id: "bunny", emoji: "🐰", label: "Bunny" },
  { id: "fox", emoji: "🦊", label: "Fox" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "lion", emoji: "🦁", label: "Lion" },
  { id: "unicorn", emoji: "🦄", label: "Unicorn" },
  { id: "dragon", emoji: "🐉", label: "Dragon" },
  { id: "owl", emoji: "🦉", label: "Owl" },
  { id: "penguin", emoji: "🐧", label: "Penguin" },
  { id: "monkey", emoji: "🐵", label: "Monkey" },
  { id: "koala", emoji: "🐨", label: "Koala" },
  { id: "elephant", emoji: "🐘", label: "Elephant" },
  { id: "frog", emoji: "🐸", label: "Frog" },
  { id: "butterfly", emoji: "🦋", label: "Butterfly" },
  { id: "dolphin", emoji: "🐬", label: "Dolphin" },
  { id: "bee", emoji: "🐝", label: "Bee" },
  { id: "turtle", emoji: "🐢", label: "Turtle" },
  { id: "duck", emoji: "🦆", label: "Duck" },
] as const;

export const choreEmojis: Record<string, string> = {
  sparkles: "✨",
  bed: "🛏️",
  dishes: "🍽️",
  broom: "🧹",
  laundry: "👕",
  dog: "🐕",
  cat: "🐈",
  trash: "🗑️",
  book: "📚",
  tooth: "🪥",
  bath: "🛁",
  homework: "📝",
  garden: "🌱",
  vacuum: "🧹",
  cook: "🍳",
  tidy: "🧸",
  mop: "🪣",
  sponge: "🧽",
  grocery: "🛒",
  recycle: "♻️",
  water: "💧",
  fold: "🧺",
  shoes: "👟",
  feed: "🥣",
  window: "🪟",
  car: "🚗",
  mail: "📬",
  organize: "📦",
  plant: "🪴",
  music: "🎵",
};

export const rewardEmojis: Record<string, string> = {
  gift: "🎁",
  icecream: "🍦",
  movie: "🎬",
  game: "🎮",
  park: "🏞️",
  toy: "🧸",
  pizza: "🍕",
  sleepover: "🌙",
  swimming: "🏊",
  bike: "🚲",
  tablet: "📱",
  treat: "🍪",
  candy: "🍬",
  star: "🌟",
  reading: "📖",
  music: "🎵",
  camp: "🏕️",
  art: "🎨",
  dance: "💃",
  zoo: "🦓",
};

/**
 * Check if a string contains emoji characters (non-ASCII).
 * Used to distinguish stored keys ("sparkles") from raw emoji ("🎯").
 */
export function isEmoji(str: string): boolean {
  if (!str) return false;
  return /\p{Emoji_Presentation}/u.test(str) || /\p{Extended_Pictographic}/u.test(str);
}

/**
 * Resolve a chore icon value. If the value matches a key in choreEmojis,
 * returns that emoji. Otherwise treats the value as a raw emoji character.
 */
export function resolveChoreEmoji(icon: string): string {
  if (choreEmojis[icon]) return choreEmojis[icon];
  if (isEmoji(icon)) return icon;
  return choreEmojis.sparkles;
}

/**
 * Resolve a reward icon value. Same key-or-raw logic.
 */
export function resolveRewardEmoji(icon: string): string {
  if (rewardEmojis[icon]) return rewardEmojis[icon];
  if (isEmoji(icon)) return icon;
  return rewardEmojis.gift;
}

export function getAvatarEmoji(avatarId: string): string {
  const found = avatars.find((a) => a.id === avatarId);
  if (found) return found.emoji;
  if (isEmoji(avatarId)) return avatarId;
  return "🐻";
}
