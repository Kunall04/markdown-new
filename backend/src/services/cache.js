import Redis from 'ioredis';

//connect to redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,           
  lazyConnect: true,             
  retryStrategy(times) {
    if (times > 2) return null;   //stop after 2 atmpt
    return Math.min(times * 300, 1000);
  },
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

//cache-aside: GET
export async function cacheGet(key) {
  try {
    const data = await redis.get(key);
    if (!data) return null;       //cache miss
    return JSON.parse(data);      //cache hit
  } catch (err) {
    console.error('Cache GET error:', err.message);
    return null;                 
  }
}

//cache-aside set
//default ttl=3600(60 min)
export async function cacheSet(key, value, ttl= 3600) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);  
  } catch (err) {
    console.error('Cache SET error:', err.message);
    //failure to cache...the next request recomputes
  }
}

export { redis };
