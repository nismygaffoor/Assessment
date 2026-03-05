const Invitation = require('../models/Invitation');
const Note = require('../models/Note');
const User = require('../models/User');

// @route   GET /api/notes/check-user?email=...
// Check if a user with the given email exists
exports.checkUser = async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ exists: false });
    try {
        const user = await User.findOne({ email }).select('name email');
        if (!user) return res.json({ exists: false });
        res.json({ exists: true, name: user.name });
    } catch (err) {
        res.status(500).json({ exists: false });
    }
};

// @route   POST /api/notes/invite/:noteId
// Create an invitation to a note
exports.inviteUser = async (req, res) => {
    const { email } = req.body;
    try {
        const note = await Note.findById(req.params.noteId);
        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Only owner can invite
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Only the owner can invite collaborators' });
        }

        const invitedUser = await User.findOne({ email });
        if (!invitedUser) {
            return res.status(404).json({ msg: 'No account found with this email. Ask them to register first.' });
        }

        if (invitedUser.id === req.user.id) {
            return res.status(400).json({ msg: 'You cannot invite yourself' });
        }

        // Check if already a collaborator
        if (note.collaborators.includes(invitedUser.id)) {
            return res.status(400).json({ msg: 'This user is already a collaborator' });
        }

        // Create or find existing invitation
        const existing = await Invitation.findOne({ note: note._id, invitedUser: invitedUser._id });
        if (existing) {
            if (existing.status === 'pending') return res.status(400).json({ msg: 'Invitation already sent' });
            if (existing.status === 'accepted') return res.status(400).json({ msg: 'User already accepted' });
            // If rejected, allow re-invite
            existing.status = 'pending';
            await existing.save();
            return res.json({ msg: 'Invitation re-sent', invitation: existing });
        }

        const invitation = new Invitation({
            note: note._id,
            invitedBy: req.user.id,
            invitedUser: invitedUser._id,
        });
        await invitation.save();

        // Notify via socket if user is online
        const io = req.app.get('io');
        io?.to(`user:${invitedUser.id}`).emit('new-invitation', {
            noteId: note._id,
            noteTitle: note.title,
            invitedByName: (await User.findById(req.user.id).select('name')).name,
        });

        res.json({ msg: 'Invitation sent', invitation });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET /api/notes/invitations
// Get all pending invitations for the current user
exports.getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({
            invitedUser: req.user.id,
            status: 'pending',
        })
            .populate('note', 'title')
            .populate('invitedBy', 'name email');
        res.json(invitations);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @route   POST /api/notes/invitations/:inviteId/accept
exports.acceptInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.inviteId);
        if (!invitation) return res.status(404).json({ msg: 'Invitation not found' });
        if (invitation.invitedUser.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        invitation.status = 'accepted';
        await invitation.save();

        // Add to collaborators
        await Note.findByIdAndUpdate(invitation.note, {
            $addToSet: { collaborators: req.user.id },
        });

        res.json({ msg: 'Invitation accepted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @route   POST /api/notes/invitations/:inviteId/reject
exports.rejectInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.inviteId);
        if (!invitation) return res.status(404).json({ msg: 'Invitation not found' });
        if (invitation.invitedUser.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        invitation.status = 'rejected';
        await invitation.save();
        res.json({ msg: 'Invitation rejected' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
