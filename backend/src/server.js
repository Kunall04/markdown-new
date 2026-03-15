import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import convertRoute from './routes/convert.js';

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