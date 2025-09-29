const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['new', 'renewal'] },
    status: { type: String, enum: ['submitted', 'approved', 'rejected', 'in-process'], default: 'submitted' },
    documents: [String],
    appointmentDate: Date,
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', ApplicationSchema);
