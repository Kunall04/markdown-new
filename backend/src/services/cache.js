import Redis from 'ioredis';

// --- Connect to Redis ---
// ioredis reads the connection string and handles parsing host/port/auth.
// If REDIS_URL isn't set, default to localhost:6379 (standard Redis port).
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 2,        // don't hang forever if Redis is down
  retryStrategy(times) {
    if (times > 3) return null;   // stop reconnecting after 3 attempts
    return Math.min(times * 200, 2000); // wait 200ms, 400ms, 600ms...
  },
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

// --- Cache-aside: GET ---
// Returns parsed object on hit, null on miss or error.
// We NEVER let a Redis failure crash the app — treat it as a cache miss.
export async function cacheGet(key) {
  try {
    const data = await redis.get(key);
    if (!data) return null;       // cache miss
    return JSON.parse(data);      // cache hit — parse JSON string back to object
  } catch (err) {
    console.error('Cache GET error:', err.message);
    return null;                  // degrade gracefully — just re-do the work
  }
}

// --- Cache-aside: SET ---
// Stores a value as a JSON string with a TTL in seconds.
// Default TTL = 3600s (60 minutes). Uses Redis EX flag for expiration.
export async function cacheSet(key, value, ttl = 3600) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    console.error('Cache SET error:', err.message);
    // failure to cache is not fatal — the next request just re-computes
  }
}

export { redis };
