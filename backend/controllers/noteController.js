const Note = require('../models/Note');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @route    POST api/notes
exports.createNote = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, content } = req.body;

        const newNote = new Note({
            title,
            content,
            user: req.user.id,
        });

        const note = await newNote.save();
        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route    GET api/notes

exports.getNotes = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const query = {
            $and: [
                { $or: [{ user: req.user.id }, { collaborators: req.user.id }] },
                { deleted: false }
            ]
        };

        const notes = await Note.find(query)
            .populate('collaborators', 'name email')
            .populate('user', 'name email')
            .populate('history.updatedBy', 'name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Note.countDocuments(query);

        res.json({
            notes,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route    GET api/notes/:id
exports.getNoteById = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id)
            .populate('collaborators', 'name email')
            .populate('user', 'name email')
            .populate('history.updatedBy', 'name email');

        if (!note) {
            return res.status(404).json({ msg: 'Note not found' });
        }

        // Check if user has access
        if (note.user.toString() !== req.user.id && !note.collaborators.includes(req.user.id)) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(note);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Note not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @route    PUT api/notes/:id
exports.updateNote = async (req, res) => {
    const { title, content } = req.body;

    const noteFields = {};
    if (title) noteFields.title = title;
    if (content) noteFields.content = content;
    noteFields.date = Date.now(); // Update the edit time

    try {
        let note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Check user and collaborator access
        if (note.user.toString() !== req.user.id && !note.collaborators.includes(req.user.id)) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const updateOp = { $set: noteFields };

        // Determine if we should push to history
        if (content && content !== note.content) {
            const lastHistory = note.history?.[note.history.length - 1];
            // Only push to history if 10 seconds have passed since the last snapshot OR if a new user edits
            if (!lastHistory ||
                (Date.now() - new Date(lastHistory.timestamp).getTime() > 10 * 1000) ||
                (lastHistory.updatedBy && lastHistory.updatedBy.toString() !== req.user.id)) {
                updateOp.$push = {
                    history: {
                        content: note.content || '', // Push the PREVIOUS state to history before saving new one
                        timestamp: Date.now(),
                        updatedBy: req.user.id
                    }
                };
            }
        }

        note = await Note.findByIdAndUpdate(
            req.params.id,
            updateOp,
            { new: true }
        ).populate('collaborators', 'name email').populate('history.updatedBy', 'name email');

        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route    DELETE api/notes/:id   Soft delete a note

exports.deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Only owner can delete the note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to delete this note' });
        }

        note.deleted = true;
        await note.save();

        res.json({ msg: 'Note moved to trash' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route    GET api/notes/search/:query
exports.searchNotes = async (req, res) => {
    try {
        const notes = await Note.find({
            $and: [
                { $or: [{ user: req.user.id }, { collaborators: req.user.id }] },
                { deleted: false },
                {
                    $or: [
                        { title: { $regex: req.params.query, $options: 'i' } },
                        { content: { $regex: req.params.query, $options: 'i' } }
                    ]
                }
            ],
        })
            .populate('collaborators', 'name email')
            .populate('user', 'name email')
            .populate('history.updatedBy', 'name email')
            .sort({ date: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route    POST api/notes/share/:id
exports.shareNote = async (req, res) => {
    const { email } = req.body;

    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ msg: 'Note not found' });

        // Only owner can share
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to share this note' });
        }

        const collaborator = await User.findOne({ email });
        if (!collaborator) {
            return res.status(404).json({ msg: 'User to share with not found' });
        }

        if (note.collaborators.includes(collaborator.id)) {
            return res.status(400).json({ msg: 'User is already a collaborator' });
        }

        note.collaborators.push(collaborator.id);
        await note.save();

        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
