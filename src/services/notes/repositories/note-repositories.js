import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import collaborationRepositories from '../../collaborations/repositories/collaboration-repositories.js';
class NoteRepositories {
  constructor() {
    this.pool = new Pool();
    this.collaborationRepositories = collaborationRepositories;
  }

  async createNote({ title, body, tags, owner }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO notes(id, title, body, tags, created_at, updated_at, owner) VALUES($1, $2, $3, $4, NOW(), NOW(), $5) RETURNING id, title, body, tags, created_at, updated_at',
      values: [id, title, body, tags, owner],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async getNotes(owner, title) {
    let text = `SELECT notes.* FROM notes
    LEFT JOIN collaborations ON collaborations.note_id = notes.id
    WHERE (notes.owner = $1 OR collaborations.user_id = $1)`;
    const values = [owner];

    if (title) {
      const titles = Array.isArray(title) ? title : [title];
      const conditions = titles.map((_, i) => `notes.title ILIKE $${i + 2}`).join(' OR ');
      text += ` AND (${conditions})`;
      titles.forEach(t => values.push(`%${t}%`));
    }

    text += ' GROUP BY notes.id';

    const result = await this.pool.query({ text, values });
    return result.rows;
  }

  async getNoteById(id) {
    const query = {
      text: `SELECT notes.*, users.username
      FROM notes
      LEFT JOIN users ON users.id = notes.owner
      WHERE notes.id = $1`,
      values: [id],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
}

  async editNote({ id, title, body, tags }) {
    const query = {
      text: 'UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = NOW() WHERE id = $4 RETURNING id, title, body, tags, created_at, updated_at, owner',
      values: [title, body, tags, id],
    };

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async deleteNote(id) {
    const query = {
      text: 'DELETE FROM notes WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);
    return result.rows[0].id;
  }

  async verifyNoteOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM notes WHERE id = $1',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      return 'not_found';
    }

    const note = result.rows[0];

    if (note.owner !== owner) {
      return 'forbidden';
    }

    return result.rows[0];
  }

  async verifyNoteAccess(noteId, userId) {
    const ownerResult = await this.verifyNoteOwner(noteId, userId);

    if (ownerResult === 'not_found') {
      return 'not_found';
    }

    if (ownerResult !== 'forbidden') {
      return ownerResult;
    }

    const isCollaborator = await this.collaborationRepositories.verifyCollaborator(noteId, userId);

    if (isCollaborator) {
      return await this.getNoteById(noteId);
    }

    return 'forbidden';
  }
}

export default new NoteRepositories();