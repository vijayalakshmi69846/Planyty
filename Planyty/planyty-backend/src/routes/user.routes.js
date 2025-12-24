const express = require('express');
const router = express.Router();

// Temporary routes - will add controllers later
router.get('/', (req, res) => {
  res.json({ message: 'Users endpoint' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get user ${req.params.id}` });
});

module.exports = router;
