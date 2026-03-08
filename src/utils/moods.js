// TMDB Genre IDs — pipe (|) = OR, comma (,) = AND
// Movie: Action 28, Adventure 12, Comedy 35, Thriller 53, Crime 80, Drama 18,
//        Romance 10749, Animation 16, Family 10751, Documentary 99,
//        Science Fiction 878, Fantasy 14, Horror 27, History 36
// TV:    Action & Adventure 10759, Comedy 35, Crime 80, Mystery 9648, Drama 18,
//        Animation 16, Family 10751, Documentary 99,
//        Sci-Fi & Fantasy 10765, War & Politics 10768

export const moods = [
  {
    slug: 'leichte-kost',
    title: 'Leichte Kost',
    subtitle: 'Zum Abschalten nach Feierabend',
    icon: '\uD83C\uDF7F',
    gradient: 'from-amber-500/20 to-orange-600/20',
    border: 'border-amber-500/30',
    movie: {
      with_genres: '35',
      'vote_average.gte': 6,
      'with_runtime.lte': 120,
      'vote_count.gte': 100,
    },
    tv: {
      with_genres: '35',
      'vote_average.gte': 6,
      'vote_count.gte': 100,
    },
  },
  {
    slug: 'spannung-pur',
    title: 'Spannung pur',
    subtitle: 'Nervenkitzel und Gänsehaut',
    icon: '\uD83D\uDD2A',
    gradient: 'from-red-500/20 to-rose-700/20',
    border: 'border-red-500/30',
    movie: {
      with_genres: '53|80',
      'vote_average.gte': 7,
      'vote_count.gte': 100,
    },
    tv: {
      with_genres: '80|9648',
      'vote_average.gte': 7,
      'vote_count.gte': 100,
    },
  },
  {
    slug: 'zum-heulen-schoen',
    title: 'Zum Heulen schön',
    subtitle: 'Emotionale Geschichten die berühren',
    icon: '\uD83D\uDC94',
    gradient: 'from-pink-500/20 to-purple-600/20',
    border: 'border-pink-500/30',
    movie: {
      with_genres: '18,10749',
      'vote_average.gte': 7,
      'vote_count.gte': 100,
    },
    tv: {
      with_genres: '18',
      'vote_average.gte': 7,
      'vote_count.gte': 100,
    },
  },
  {
    slug: 'familienabend',
    title: 'Familienabend',
    subtitle: 'Spaß für Groß und Klein',
    icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66',
    gradient: 'from-emerald-500/20 to-teal-600/20',
    border: 'border-emerald-500/30',
    movie: {
      with_genres: '16|10751',
      'vote_average.gte': 6,
      'vote_count.gte': 50,
    },
    tv: {
      with_genres: '16|10751',
      'vote_average.gte': 6,
      'vote_count.gte': 50,
    },
  },
  {
    slug: 'gehirnfutter',
    title: 'Gehirnfutter',
    subtitle: 'Dokus die den Horizont erweitern',
    icon: '\uD83E\uDDE0',
    gradient: 'from-blue-500/20 to-indigo-600/20',
    border: 'border-blue-500/30',
    movie: {
      with_genres: '99',
      'vote_average.gte': 7,
      'vote_count.gte': 50,
    },
    tv: {
      with_genres: '99',
      'vote_average.gte': 7,
      'vote_count.gte': 50,
    },
  },
  {
    slug: 'action-abenteuer',
    title: 'Action & Abenteuer',
    subtitle: 'Explosionen und Heldentaten',
    icon: '\uD83D\uDCA5',
    gradient: 'from-orange-500/20 to-red-600/20',
    border: 'border-orange-500/30',
    movie: {
      with_genres: '28|12',
      'vote_average.gte': 6,
      'vote_count.gte': 100,
    },
    tv: {
      with_genres: '10759',
      'vote_average.gte': 6,
      'vote_count.gte': 100,
    },
  },
  {
    slug: 'sci-fi-fantasy',
    title: 'Sci-Fi & Fantasy',
    subtitle: 'Andere Welten und Zukunftsvisionen',
    icon: '\uD83D\uDE80',
    gradient: 'from-violet-500/20 to-purple-700/20',
    border: 'border-violet-500/30',
    movie: {
      with_genres: '878|14',
      'vote_average.gte': 6.5,
      'vote_count.gte': 100,
    },
    tv: {
      with_genres: '10765',
      'vote_average.gte': 6.5,
      'vote_count.gte': 100,
    },
  },
  {
    slug: 'horror-grusel',
    title: 'Horror & Grusel',
    subtitle: 'Nichts für schwache Nerven',
    icon: '\uD83D\uDC7B',
    gradient: 'from-gray-600/20 to-gray-800/20',
    border: 'border-gray-500/30',
    movie: {
      with_genres: '27',
      'vote_average.gte': 6,
      'vote_count.gte': 100,
    },
    tv: {
      with_genres: '9648',
      'vote_average.gte': 6,
      'vote_count.gte': 100,
    },
  },
  {
    slug: 'feel-good',
    title: 'Feel-Good',
    subtitle: 'Gute Laune garantiert',
    icon: '\u2600\uFE0F',
    gradient: 'from-yellow-400/20 to-amber-500/20',
    border: 'border-yellow-400/30',
    movie: {
      with_genres: '35,10749',
      'vote_average.gte': 6,
      'vote_count.gte': 50,
    },
    tv: {
      with_genres: '35,18',
      'vote_average.gte': 6,
      'vote_count.gte': 50,
    },
  },
  {
    slug: 'historisch',
    title: 'Historisch',
    subtitle: 'Reisen in die Vergangenheit',
    icon: '\uD83C\uDFDB\uFE0F',
    gradient: 'from-stone-500/20 to-amber-700/20',
    border: 'border-stone-500/30',
    movie: {
      with_genres: '36',
      'vote_average.gte': 7,
      'vote_count.gte': 50,
    },
    tv: {
      with_genres: '10768',
      'vote_average.gte': 7,
      'vote_count.gte': 50,
    },
  },
]

export function getMoodBySlug(slug) {
  return moods.find((m) => m.slug === slug)
}
