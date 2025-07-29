const express = require('express');
const router = express.Router();
const db = require('../config/db'); // or your MySQL config file

router.get('/all', async (req, res) => {
  try {
    const [lostItems] = await db.query('SELECT * FROM lost_items ORDER BY date_lost DESC');
    const [foundItems] = await db.query('SELECT * FROM found_items ORDER BY date_found DESC');

    res.json({
      lostItems,
      foundItems,
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;
