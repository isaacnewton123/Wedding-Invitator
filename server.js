const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./database/comments.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        // Buat tabel jika belum ada
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            attendance TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Fungsi helper untuk format response
function formatComment(comment) {
    return {
        id: comment.id,
        name: comment.name,
        attendance: comment.attendance,
        message: comment.message,
        timestamp: comment.timestamp
    };
}

// API Endpoints

// Get comments dengan pagination
app.get('/api/comments', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Jumlah komentar per halaman
    const offset = (page - 1) * limit;

    // Get total count
    db.get('SELECT COUNT(*) as total FROM comments', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const totalComments = row.total;
        const totalPages = Math.ceil(totalComments / limit);

        // Get comments for current page
        db.all(
            'SELECT * FROM comments ORDER BY timestamp DESC LIMIT ? OFFSET ?',
            [limit, offset],
            (err, comments) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                res.json({
                    comments: comments.map(formatComment),
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalComments,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                });
            }
        );
    });
});

// Post new comment
app.post('/api/comments', (req, res) => {
    const { name, attendance, message } = req.body;
    
    // Validasi input
    if (!name || !attendance || !message) {
        res.status(400).json({ error: "Semua field harus diisi" });
        return;
    }

    db.run(
        'INSERT INTO comments (name, attendance, message) VALUES (?, ?, ?)',
        [name, attendance, message],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Ambil komentar yang baru ditambahkan
            db.get(
                'SELECT * FROM comments WHERE id = ?',
                [this.lastID],
                (err, row) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    const formattedComment = formatComment(row);
                    
                    // Emit event untuk realtime update
                    io.emit('newComment', formattedComment);
                    
                    res.json({
                        message: "Komentar berhasil ditambahkan",
                        data: formattedComment
                    });
                }
            );
        }
    );
});

// Delete comment (optional, untuk admin)
app.delete('/api/comments/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM comments WHERE id = ?', id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "Komentar tidak ditemukan" });
            return;
        }
        io.emit('commentDeleted', id);
        res.json({ message: "Komentar berhasil dihapus" });
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: "Terjadi kesalahan pada server",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});