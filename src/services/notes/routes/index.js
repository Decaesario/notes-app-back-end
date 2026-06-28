import express from 'express';
import {
  createNote, getNotes, getNoteById, editNoteById, deleteNoteById
} from '../controller/note-controller.js';
import validate, { validateQuery } from '../../../middlewares/validate.js';
import { notePayloadSchema, noteQuerySchema, noteUpdatePayloadSchema } from '../validator/schema.js';
import authenticateToken from '../../../middlewares/auth.js';

const router = express.Router();

router.post('/notes', authenticateToken, validate(notePayloadSchema), createNote);
router.get('/notes', authenticateToken, validateQuery(noteQuerySchema), getNotes);
router.get('/notes/:id', authenticateToken, getNoteById);
router.put('/notes/:id', authenticateToken, validate(noteUpdatePayloadSchema), editNoteById);
router.delete('/notes/:id', authenticateToken, deleteNoteById);

export default router;