// State management
let currentUser = null;
let currentNote = null;
let notes = [];

// DOM Elements
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const notesList = document.getElementById('notesList');
const noteEditor = document.getElementById('noteEditor');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const noteTags = document.getElementById('noteTags');

// Auth Form Switching
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('d-none');
    registerForm.classList.remove('d-none');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
});

// Auth Functions
async function register(email, password) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

// Note Functions
async function fetchNotes(search = '', tag = '') {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (tag) params.append('tag', tag);

        const response = await fetch(`/api/notes?${params}`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function createNote(noteData) {
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(noteData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function updateNote(noteId, noteData) {
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(noteData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function deleteNote(noteId) {
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }
    } catch (error) {
        throw error;
    }
}

async function shareNote(noteId, email, permission) {
    try {
        const response = await fetch(`/api/notes/${noteId}/shares`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ email, permission })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchVersions(noteId) {
    try {
        const response = await fetch(`/api/notes/${noteId}/versions`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

// UI Functions
function displayNotes(notesList, notes) {
    notesList.innerHTML = notes.map(note => `
        <div class="list-group-item" data-note-id="${note._id}">
            <h5 class="mb-1">${note.title}</h5>
            <p class="mb-1">${note.content.substring(0, 100)}...</p>
            <div>
                ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}
            </div>
            <small class="text-muted">Last updated: ${new Date(note.updatedAt).toLocaleString()}</small>
        </div>
    `).join('');
}

function displayVersions(versionsList, versions) {
    versionsList.innerHTML = versions.map(version => `
        <div class="list-group-item">
            <h6>Version ${version.versionNumber}</h6>
            <p class="mb-1">${version.content.substring(0, 100)}...</p>
            <div class="version-info">
                <span>Edited by: ${version.editedBy}</span>
                <span>Date: ${new Date(version.editedAt).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

// Event Listeners
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const data = await register(email, password);
        currentUser = { token: data.token };
        authContainer.classList.add('d-none');
        mainContainer.classList.remove('d-none');
        loadNotes();
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const data = await login(email, password);
        currentUser = { token: data.token };
        authContainer.classList.add('d-none');
        mainContainer.classList.remove('d-none');
        loadNotes();
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    currentUser = null;
    currentNote = null;
    notes = [];
    mainContainer.classList.add('d-none');
    authContainer.classList.remove('d-none');
    notesList.innerHTML = '';
    clearNoteEditor();
});

document.getElementById('newNoteBtn').addEventListener('click', () => {
    currentNote = null;
    clearNoteEditor();
});

document.getElementById('saveNoteBtn').addEventListener('click', async () => {
    try {
        const noteData = {
            title: noteTitle.value,
            content: noteContent.value,
            tags: noteTags.value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        if (currentNote) {
            await updateNote(currentNote._id, noteData);
        } else {
            await createNote(noteData);
        }

        loadNotes();
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('deleteNoteBtn').addEventListener('click', async () => {
    if (!currentNote) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        await deleteNote(currentNote._id);
        currentNote = null;
        clearNoteEditor();
        loadNotes();
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('shareNoteBtn').addEventListener('click', () => {
    if (!currentNote) return;
    const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
    shareModal.show();
});

document.getElementById('shareForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentNote) return;

    try {
        const email = document.getElementById('shareEmail').value;
        const permission = document.getElementById('sharePermission').value;
        await shareNote(currentNote._id, email, permission);
        bootstrap.Modal.getInstance(document.getElementById('shareModal')).hide();
        alert('Note shared successfully');
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('versionsBtn').addEventListener('click', async () => {
    if (!currentNote) return;

    try {
        const versions = await fetchVersions(currentNote._id);
        displayVersions(document.getElementById('versionsList'), versions);
        const versionsModal = new bootstrap.Modal(document.getElementById('versionsModal'));
        versionsModal.show();
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('searchInput').addEventListener('input', debounce(async (e) => {
    try {
        const search = e.target.value;
        notes = await fetchNotes(search);
        displayNotes(notesList, notes);
    } catch (error) {
        alert(error.message);
    }
}, 300));

// Helper Functions
function clearNoteEditor() {
    noteTitle.value = '';
    noteContent.value = '';
    noteTags.value = '';
}

async function loadNotes() {
    try {
        notes = await fetchNotes();
        displayNotes(notesList, notes);
    } catch (error) {
        alert(error.message);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Note selection
notesList.addEventListener('click', (e) => {
    const noteItem = e.target.closest('.list-group-item');
    if (!noteItem) return;

    const noteId = noteItem.dataset.noteId;
    currentNote = notes.find(note => note._id === noteId);
    if (!currentNote) return;

    noteTitle.value = currentNote.title;
    noteContent.value = currentNote.content;
    noteTags.value = currentNote.tags.join(', ');

    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    noteItem.classList.add('active');
});