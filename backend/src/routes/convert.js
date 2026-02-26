import { Router } from 'express';
const router=Router();

router.post('/convert', (req, res) => {
  res.json({ message: 'Route working — pipeline coming soon' });
});

export default router;