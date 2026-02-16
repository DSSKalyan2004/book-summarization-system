const express = require('express');
const router = express.Router();
const Summary = require('../models/Summary');

// GET all summaries
router.get('/', async (req, res) => {
  try {
    const summaries = await Summary.find()
      .sort({ timestamp: -1 })
      .select('-__v -createdAt -updatedAt');
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summaries', message: error.message });
  }
});

// GET single summary by ID
router.get('/:id', async (req, res) => {
  try {
    const summary = await Summary.findOne({ id: req.params.id })
      .select('-__v -createdAt -updatedAt');
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary', message: error.message });
  }
});

// POST create new summary
router.post('/', async (req, res) => {
  try {
    const summaryData = req.body;
    const newSummary = new Summary(summaryData);
    await newSummary.save();
    res.status(201).json(newSummary);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create summary', message: error.message });
  }
});

// DELETE summary by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await Summary.findOneAndDelete({ id: req.params.id });
    if (!result) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    res.json({ message: 'Summary deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete summary', message: error.message });
  }
});

// PUT update summary by ID
router.put('/:id', async (req, res) => {
  try {
    const summary = await Summary.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).select('-__v -createdAt -updatedAt');
    
    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update summary', message: error.message });
  }
});

module.exports = router;
