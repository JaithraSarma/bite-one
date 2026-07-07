## QuickNotes
A minimal single-page notes app where authenticated users can create and read their own private notes.

### Users
Individual users who want a fast, private place to jot down text notes. They sign up with an email and password, log in on return visits, and expect to see only their own content — never anyone else's.

### Screens
1. **Auth Screen** – Shown to unauthenticated visitors. Displays a togglable Email + Password form that switches between "Sign Up" and "Log In" modes. On success the user is redirected to the Notes List screen.
2. **Notes List Screen** – The main screen for authenticated users. Shows all of the current user's notes as cards sorted by newest first, each displaying its title, body preview, and creation timestamp. Contains a "New Note" button that opens the Note Editor screen.
3. **Note Editor Screen** – A simple form with a Title field (text, required) and a Body field (textarea, optional). Submitting saves a new note to the database and returns the user to the Notes List screen. A "Cancel" button discards changes and also returns to the list.

### Data model

**notes**
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default `gen_random_uuid()` |
| user_id | uuid | References `auth.users(id)`, not null |
| title | text | Not null |
| body | text | Nullable |
| created_at | timestamptz | Default `now()` |

RLS rule: a user may SELECT, INSERT, UPDATE, or DELETE only rows where `user_id = auth.uid()`.

### Out of scope
- Password reset / forgot-password flow
- Note editing or deletion after creation
- Note search or filtering
- Tags, categories, or folders
- Rich text / markdown rendering
- File or image attachments
- Sharing notes with other users
- Teams or collaborative editing
- Admin panel or moderation tools
- Offline support or local caching
- Pagination (assumed note count stays small)
