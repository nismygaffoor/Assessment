const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const noteController = require('../controllers/noteController');
const invitationController = require('../controllers/invitationController');

// ── Invitation routes (must be before /:id to avoid conflicts) ──

// @route   GET api/notes/check-user?email=...
router.get('/check-user', auth, invitationController.checkUser);

// @route   GET api/notes/invitations
router.get('/invitations', auth, invitationController.getInvitations);

// @route   POST api/notes/invite/:noteId
router.post('/invite/:noteId', [auth, [
    check('email', 'Please include a valid email').isEmail(),
]], invitationController.inviteUser);

// @route   POST api/notes/invitations/:inviteId/accept
router.post('/invitations/:inviteId/accept', auth, invitationController.acceptInvitation);

// @route   POST api/notes/invitations/:inviteId/reject
router.post('/invitations/:inviteId/reject', auth, invitationController.rejectInvitation);

// ── Note CRUD routes ──

// @route   GET api/notes/search/:query  (before /:id)
router.get('/search/:query', auth, noteController.searchNotes);

// @route   POST api/notes
router.post('/', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
]], noteController.createNote);

// @route   GET api/notes
router.get('/', auth, noteController.getNotes);

// @route   GET api/notes/:id
router.get('/:id', auth, noteController.getNoteById);

// @route   PUT api/notes/:id
router.put('/:id', auth, noteController.updateNote);

// @route   DELETE api/notes/:id
router.delete('/:id', auth, noteController.deleteNote);

module.exports = router;
