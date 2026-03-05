const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
    note: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        required: true,
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent duplicate invitations for the same note+user
InvitationSchema.index({ note: 1, invitedUser: 1 }, { unique: true });

module.exports = mongoose.model('Invitation', InvitationSchema);
