import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import convertRoute, { handleConvert } from './routes/convert.js';
import limiter from './middleware/rateLimiter.js';

dotenv.config();

const app=express();
const PORT=process.env.PORT || 3001;

app.set('trust proxy', 1); //for railway

app.use(cors());    
app.use(express.json());   

app.get('/health',(req,res)=>{
    res.json({ status: 'ok' , timestamp: new Date().toISOString() })
});

app.use('/api', convertRoute);

// URL-in-path style: GET /https://example.com → same as GET /api/convert?url=https://example.com
// Useful for curl: curl mkdn.up.railway.app/https://example.com
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  const raw = req.path.slice(1); // strip leading /
  if (!raw) return next();

  const decoded = decodeURIComponent(raw);
  const normalised = decoded.replace(/^(https?:\/)([^/])/, '$1/$2');

  if (!/^https?:\/\//.test(normalised)) return next();

  req.query = { ...req.query, url: normalised };
  return limiter(req, res, (err) => {
    if (err) return next(err);
    return handleConvert(req, res, next);
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});