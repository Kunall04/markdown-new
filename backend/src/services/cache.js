import Redis from 'ioredis';

//connect to redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 2,        
  retryStrategy(times) {
    if (times > 3) return null;   //stop reconnecting
    return Math.min(times * 200, 2000);  // wait 200,400,600ms...
  },
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

//cache-aside: GET
export async function cacheGet(key) {
  try {
    const data = await redis.get(key);
    if (!data) return null;       //cache miss
    return JSON.parse(data);      //cache hit— parse json string back to object
  } catch (err) {
    console.error('Cache GET error:', err.message);
    return null;                 
  }
}

//cache-aside: SET
//default ttl=3600s(60 minutes)
export async function cacheSet(key, value, ttl= 3600) {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);  
  } catch (err) {
    console.error('Cache SET error:', err.message);
    //failure to cache is not fatal— the next request just re-computesh
  }
}

export { redis };
