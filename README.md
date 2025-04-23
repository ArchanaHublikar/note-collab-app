# note-collab-app
A full-stack Note Collaboration App with user authentication, sharing &amp; permissions, version history, and powerful search functionality using Node.js, MongoDB, and JWT.


# Note Collaboration App

This is a backend project for a Note Collaboration Application built with Node.js and MongoDB.

## Features

- User registration and login (JWT-based authentication)
- Create, edit, delete personal notes
- Share notes with other users by email (read/edit permissions)
- View and manage version history of each note
- Search notes by title, tag, or content

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Token)

## Installation

1. Clone the repository:

- `POST /auth/login` –
git clone https://github.com/your-username/note-collaboration-app.git cd note-collaboration-app

2. Install dependencies:


## API Overview

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get a JWT token

### Notes

- `POST /notes` - Create a note
- `GET /notes/:id` - Get a note
- `PUT /notes/:id` - Update a note
- `DELETE /notes/:id` - Delete a note

### Sharing & Permissions

- `POST /notes/:id/share` - Share with another user
- `POST /notes/:id/revoke` - Revoke access

### Version History

- `POST /notes/:id/version` - Save version
- `GET /notes/:id/versions` - View versions

### Search

- `GET /notes/search?title=...`
- `GET /notes/search?tag=...`
- `GET /notes/search?content=...`

## License

MIT © 2025 Archana Hublikar
