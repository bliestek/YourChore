// Available icons for chores and rewards
// These map to react-icons identifiers

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
};

export function getAvatarEmoji(avatarId: string): string {
  return avatars.find((a) => a.id === avatarId)?.emoji || "🐻";
}
