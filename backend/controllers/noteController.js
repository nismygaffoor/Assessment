const Note = require('../models/Note');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @route    POST api/notes
// @desc     Create a note
// @access   Private
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
// @desc     Get all notes for a user (including collaborative ones) with pagination
// @access   Private
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
// @desc     Get note by ID
// @access   Private
exports.getNoteById = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

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
// @desc     Update a note
// @access   Private
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

        note = await Note.findByIdAndUpdate(
            req.params.id,
            { $set: noteFields },
            { new: true }
        );

        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route    DELETE api/notes/:id
// @desc     Soft delete a note
// @access   Private
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
// @desc     Search notes by title or content
// @access   Private
exports.searchNotes = async (req, res) => {
    try {
        const notes = await Note.find({
            $and: [
                { $or: [{ user: req.user.id }, { collaborators: req.user.id }] },
                { $text: { $search: req.params.query } },
            ],
        }).sort({ date: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route    POST api/notes/share/:id
// @desc     Add a collaborator to a note
// @access   Private
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
