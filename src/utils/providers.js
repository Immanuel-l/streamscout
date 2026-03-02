// Erlaubte Streaming-Anbieter für Deutschland (TMDB Provider IDs)
export const ALLOWED_PROVIDER_IDS = [
  8,    // Netflix
  9,    // Amazon Prime Video
  337,  // Disney+
  350,  // Apple TV+
  30,   // WOW
  531,  // Paramount+
  1899, // HBO Max
  298,  // RTL+
  304,  // Joyn
  421,  // Joyn Plus
]

export const ALLOWED_PROVIDER_SET = new Set(ALLOWED_PROVIDER_IDS)

// Pipe-separated string for TMDB discover API with_watch_providers param
export const ALLOWED_PROVIDER_STRING = ALLOWED_PROVIDER_IDS.join('|')
