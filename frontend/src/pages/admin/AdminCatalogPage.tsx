import { useEffect, useMemo, useState } from 'react';
import BookDetailsDrawer from '../../components/books/BookDetailsDrawer';
import {
  archiveBook,
  createBook,
  createCopy,
  deleteBook,
  restoreBook,
  updateBook,
  searchBooks
} from '../../services/books.api';

type BookSummary = {
  id: string;
  code?: string;
  title: string;
  authors?: string[];
  status?: 'active' | 'archived';
  availability?: { total: number; available: number };
};

export default function AdminCatalogPage() {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [status, setStatus] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    authors: '',
    genres: '',
    tags: '',
    description: '',
    pageCount: '',
    language: '',
    coverImageUrl: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [editing, setEditing] = useState<BookSummary | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [rowLoadingAction, setRowLoadingAction] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    authors: '',
    genres: '',
    tags: '',
    description: '',
    pageCount: '',
    language: '',
    coverImageUrl: ''
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(books.length / pageSize)), [books.length, pageSize]);
  const pagedBooks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return books.slice(start, start + pageSize);
  }, [books, page, pageSize]);

  const loadBooks = (query?: string) => {
    setCatalogLoading(true);
    const trimmed = (query ?? '').trim();
    const params = trimmed ? { q: trimmed } : {};
    return searchBooks(params)
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setCatalogLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(catalogQuery), 320);
    return () => clearTimeout(timer);
  }, [catalogQuery]);

  useEffect(() => {
    setPage(1);
    loadBooks(debouncedQuery);
  }, [debouncedQuery]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(books.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [books.length, page, pageSize]);

  const onCreateBook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (createLoading) return;
    setCreateLoading(true);
    setStatus('');
    try {
      await createBook({
        title: form.title,
        authors: form.authors.split(',').map((value) => value.trim()).filter(Boolean),
        genres: form.genres.split(',').map((value) => value.trim()).filter(Boolean),
        tags: form.tags.split(',').map((value) => value.trim()).filter(Boolean),
        description: form.description,
        pageCount: form.pageCount ? Number(form.pageCount) : undefined,
        language: form.language || undefined,
        coverImageUrl: form.coverImageUrl || undefined
      });
      setForm({
        title: '',
        authors: '',
        genres: '',
        tags: '',
        description: '',
        pageCount: '',
        language: '',
        coverImageUrl: ''
      });
      loadBooks(debouncedQuery);
      setStatus('Book created.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create book');
    } finally {
      setCreateLoading(false);
    }
  };

  const onAddCopy = async (bookId: string) => {
    if (rowLoadingId) return;
    setRowLoadingId(bookId);
    setRowLoadingAction('add-copy');
    setStatus('');
    try {
      await createCopy(bookId, { status: 'available' });
      await loadBooks(debouncedQuery);
      setStatus('Copy added.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to add copy');
    } finally {
      setRowLoadingId(null);
      setRowLoadingAction('');
    }
  };

  const startEdit = (book: BookSummary) => {
    setEditing(book);
    setEditForm({
      title: book.title ?? '',
      authors: book.authors?.join(', ') ?? '',
      genres: '',
      tags: '',
      description: '',
      pageCount: '',
      language: '',
      coverImageUrl: ''
    });
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || editLoading) return;
    setEditLoading(true);
    setStatus('');
    try {
      await updateBook(editing.id, {
        title: editForm.title,
        authors: editForm.authors.split(',').map((value) => value.trim()).filter(Boolean),
        genres: editForm.genres.split(',').map((value) => value.trim()).filter(Boolean),
        tags: editForm.tags.split(',').map((value) => value.trim()).filter(Boolean),
        description: editForm.description,
        pageCount: editForm.pageCount ? Number(editForm.pageCount) : undefined,
        language: editForm.language || undefined,
        coverImageUrl: editForm.coverImageUrl || undefined
      });
      setEditing(null);
      loadBooks(debouncedQuery);
      setStatus('Book updated.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to update book');
    } finally {
      setEditLoading(false);
    }
  };

  const runRowAction = async (bookId: string, action: 'archive' | 'restore' | 'delete') => {
    if (rowLoadingId) return;
    setRowLoadingId(bookId);
    setRowLoadingAction(action);
    setStatus('');
    try {
      if (action === 'archive') {
        await archiveBook(bookId);
        setStatus('Book archived.');
      }
      if (action === 'restore') {
        await restoreBook(bookId);
        setStatus('Book restored.');
      }
      if (action === 'delete') {
        await deleteBook(bookId);
        setStatus('Book deleted.');
      }
      await loadBooks(debouncedQuery);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Failed to ${action} book`);
    } finally {
      setRowLoadingId(null);
      setRowLoadingAction('');
    }
  };

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <div>
          <h2>Admin Catalog</h2>
          <p className="muted">Create books, add copies, and manage availability.</p>
        </div>
        <span className="pill">{books.length} books</span>
      </div>
      <div className="grid grid-2">
        <form className="card" onSubmit={onCreateBook}>
          <span className="tag">New Book</span>
          <strong>Create a new title</strong>
          <input
            className="input"
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Authors (comma-separated)"
            value={form.authors}
            onChange={(event) => setForm({ ...form, authors: event.target.value })}
          />
          <input
            className="input"
            placeholder="Genres"
            value={form.genres}
            onChange={(event) => setForm({ ...form, genres: event.target.value })}
          />
          <input
            className="input"
            placeholder="Tags"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
          />
          <input
            className="input"
            placeholder="Language"
            value={form.language}
            onChange={(event) => setForm({ ...form, language: event.target.value })}
          />
          <input
            className="input"
            placeholder="Page count"
            value={form.pageCount}
            onChange={(event) => setForm({ ...form, pageCount: event.target.value })}
          />
          <input
            className="input"
            placeholder="Cover image URL"
            value={form.coverImageUrl}
            onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })}
          />
          <textarea
            className="input"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={4}
          />
          <button type="submit" className="button" disabled={createLoading}>
            {createLoading ? 'Creating...' : 'Create Book'}
          </button>
          {status ? <div className="muted">{status}</div> : null}
        </form>

        <div className="card">
          <span className="tag">Edit Book</span>
          <strong>{editing ? editing.title : 'Select a book to edit'}</strong>
          {editing ? (
            <form onSubmit={saveEdit} className="form-row">
              <input
                className="input"
                placeholder="Title"
                value={editForm.title}
                onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Authors"
                value={editForm.authors}
                onChange={(event) => setEditForm({ ...editForm, authors: event.target.value })}
              />
              <input
                className="input"
                placeholder="Genres"
                value={editForm.genres}
                onChange={(event) => setEditForm({ ...editForm, genres: event.target.value })}
              />
              <input
                className="input"
                placeholder="Tags"
                value={editForm.tags}
                onChange={(event) => setEditForm({ ...editForm, tags: event.target.value })}
              />
              <input
                className="input"
                placeholder="Language"
                value={editForm.language}
                onChange={(event) => setEditForm({ ...editForm, language: event.target.value })}
              />
              <input
                className="input"
                placeholder="Page count"
                value={editForm.pageCount}
                onChange={(event) => setEditForm({ ...editForm, pageCount: event.target.value })}
              />
              <input
                className="input"
                placeholder="Cover image URL"
                value={editForm.coverImageUrl}
                onChange={(event) => setEditForm({ ...editForm, coverImageUrl: event.target.value })}
              />
              <textarea
                className="input"
                placeholder="Description"
                value={editForm.description}
                onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                rows={4}
              />
              <div className="split">
                <button type="submit" className="button" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="button ghost" disabled={editLoading} onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <span className="muted">Pick a book from the list to edit its fields.</span>
          )}
        </div>
      </div>

      <div className="panel-header" style={{ marginTop: '1.5rem' }}>
        <div>
          <h3>Catalog</h3>
          <p className="muted">Browse and manage the current catalog.</p>
        </div>
        <div className="split">
          <input
            className="input"
            value={catalogQuery}
            onChange={(event) => setCatalogQuery(event.target.value)}
            placeholder="Search books by title, code, author, description"
          />
          <select
            className="input"
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as 'grid' | 'list')}
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
          <select
            className="input"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            <option value={6}>6 / page</option>
            <option value={8}>8 / page</option>
            <option value={12}>12 / page</option>
          </select>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'grid grid-2' : 'grid'} style={{ marginTop: '1rem' }}>
        {catalogLoading ? <div className="muted">Searching catalog...</div> : null}
        {books.length === 0 ? (
          <div className="card">
            <span className="tag">No books</span>
            <strong>{debouncedQuery.trim() ? 'No matching books found' : 'Create your first book'}</strong>
            <span className="muted">
              {debouncedQuery.trim()
                ? 'Try a different title, code, author, or keyword.'
                : 'Add metadata and at least one copy to begin lending.'}
            </span>
          </div>
        ) : null}
        {pagedBooks.map((book) => (
          <div
            key={book.id}
            className="card clickable-card"
            onClick={() => {
              setSelectedBookId(book.id);
            }}
          >
            <span className="tag">Book</span>
            <strong>{book.title}</strong>
            {book.code ? <span className="muted">{book.code}</span> : null}
            {book.authors?.length ? <span className="muted">{book.authors.join(', ')}</span> : null}
            <span className={`status ${book.status === 'archived' ? 'archived' : ''}`}>{book.status}</span>
            <span className="muted">
              Available {book.availability?.available ?? 0}/{book.availability?.total ?? 0}
            </span>
            <div className="split">
              <button
                type="button"
                className="button secondary"
                disabled={rowLoadingId === book.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onAddCopy(book.id);
                }}
              >
                {rowLoadingId === book.id && rowLoadingAction === 'add-copy' ? 'Adding...' : 'Add Copy'}
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={!!rowLoadingId}
                onClick={(event) => {
                  event.stopPropagation();
                  startEdit(book);
                }}
              >
                Edit
              </button>
              {book.status === 'archived' ? (
                <button
                  type="button"
                  className="button"
                  disabled={rowLoadingId === book.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    runRowAction(book.id, 'restore');
                  }}
                >
                  {rowLoadingId === book.id && rowLoadingAction === 'restore' ? 'Restoring...' : 'Restore'}
                </button>
              ) : (
                <button
                  type="button"
                  className="button"
                  disabled={rowLoadingId === book.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    runRowAction(book.id, 'archive');
                  }}
                >
                  {rowLoadingId === book.id && rowLoadingAction === 'archive' ? 'Archiving...' : 'Archive'}
                </button>
              )}
              <button
                type="button"
                className="button danger"
                disabled={rowLoadingId === book.id}
                onClick={(event) => {
                  event.stopPropagation();
                  runRowAction(book.id, 'delete');
                }}
              >
                {rowLoadingId === book.id && rowLoadingAction === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="split" style={{ marginTop: '1rem' }}>
        <button type="button" className="button secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span className="pill">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="button secondary"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
      <BookDetailsDrawer
        bookId={selectedBookId}
        onClose={() => setSelectedBookId(null)}
        adminMode
        onCopiesChanged={loadBooks}
      />
    </div>
  );
}
