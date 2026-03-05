const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const noteController = require('../controllers/noteController');

// @route    POST api/notes
router.post(
    '/',
    [
        auth,
        [
            check('title', 'Title is required').not().isEmpty(),
            check('content', 'Content is required').not().isEmpty(),
        ],
    ],
    noteController.createNote
);

// @route    GET api/notes
router.get('/', auth, noteController.getNotes);

// @route    GET api/notes/:id
router.get('/:id', auth, noteController.getNoteById);

// @route    PUT api/notes/:id
router.put('/:id', auth, noteController.updateNote);

// @route    DELETE api/notes/:id
router.delete('/:id', auth, noteController.deleteNote);

// @route    GET api/notes/search/:query
router.get('/search/:query', auth, noteController.searchNotes);

// @route    POST api/notes/share/:id
router.post(
    '/share/:id',
    [auth, [check('email', 'Please include a valid email').isEmail()]],
    noteController.shareNote
);

module.exports = router;
