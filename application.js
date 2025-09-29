const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');

// Submit Application
router.post('/submit', async (req, res) => {
    const { applicant, type, documents } = req.body;
    const application = new Application({ applicant, type, documents });
    await application.save();
    res.json({ message: 'Application submitted successfully' });
});

// Track Application
router.get('/track/:applicantId', async (req, res) => {
    const applications = await Application.find({ applicant: req.params.applicantId });
    res.json(applications);
});

// Approve/Reject Application
router.put('/update-status/:id', async (req, res) => {
    const { status } = req.body;
    await Application.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Application status updated' });
});

// Schedule Appointment
router.put('/schedule/:id', async (req, res) => {
    const { appointmentDate } = req.body;
    await Application.findByIdAndUpdate(req.params.id, { appointmentDate });
    res.json({ message: 'Appointment scheduled' });
});

module.exports = router;
