require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json()); // ✅ Needed for JSON parsing

const PORT = process.env.PORT || 5001;

// ✅ Connect to Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ✅ Fetch Players Data
app.get('/api/players', async (req, res) => {
    const { data, error } = await supabase.from('players').select('*');

    if (error) {
        console.error('❌ Error fetching players:', error);
        return res.status(500).json({ error: 'Failed to fetch players' });
    }

    res.json({ players: data });
});

// ✅ Fetch Books Data (ALL Books - For Admin Use)
app.get('/api/books', async (req, res) => {
    const { data, error } = await supabase.from('logged_books').select('*');

    if (error) {
        console.error('❌ Error fetching books:', error);
        return res.status(500).json({ error: 'Failed to fetch books' });
    }

    res.json({ books: data });
});

// ✅ Fetch Books for the Logged-In User
app.get('/api/my-books', async (req, res) => {
    const { player_id } = req.query; // 👈 Get `player_id` from the frontend request

    if (!player_id) {
        return res.status(400).json({ error: "Player ID is required" });
    }

    const { data, error } = await supabase
        .from('logged_books')
        .select('*')
        .eq('player_id', player_id); // ✅ Filter by player_id, NOT player_name

    if (error) {
        console.error('❌ Error fetching user books:', error);
        return res.status(500).json({ error: 'Failed to fetch books' });
    }

    res.json({ books: data });
});

// ✅ Fetch Player Rankings
app.get('/api/rankings', async (req, res) => {
    try {
        console.log("🔹 Fetching player rankings from Supabase...");

        const { data, error } = await supabase
            .from('players')
            .select('player_name, total_points')
            .order('total_points', { ascending: false });

        if (error) {
            console.error('❌ Supabase Query Error:', error);
            return res.status(500).json({ error: 'Failed to fetch rankings.' });
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No ranking data found.');
            return res.status(404).json({ error: 'No ranking data available.' });
        }

        console.log("✅ Rankings Data Fetched:", data);

        res.json({ rankings: data });
    } catch (err) {
        console.error("❌ Unexpected Error in /api/rankings:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Submit a New Book (Now Uses player_id)
app.post("/api/submit-book", async (req, res) => {
    const { player_id, title, pages, year_published, completed, genre, rating, points } = req.body;

    if (!player_id) {
        return res.status(400).json({ error: "Player ID is required to log a book" });
    }

    const { data, error } = await supabase
        .from("logged_books")
        .insert([{ player_id, title, pages, year_published, completed, genre, rating, points }]);

    if (error) {
        console.error("❌ Error logging book:", error);
        return res.status(500).json({ error: "Failed to log book" });
    }

    res.status(201).json({ message: "Book submitted successfully", book: data });
});

app.get("/api/player-books", async (req, res) => {
    const { player_name } = req.query;

    if (!player_name) {
        return res.status(400).json({ error: "Player name is required" });
    }

    const { data, error } = await supabase
        .from("logged_books")
        .select("*")
        .eq("player_name", player_name);

    if (error) {
        console.error("❌ Error fetching books for player:", error);
        return res.status(500).json({ error: "Failed to fetch books" });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({ error: "No books found for this player." });
    }

    res.json({ books: data });
});

app.put("/api/update-book/:bookId", async (req, res) => {
    const { bookId } = req.params;
    const { currentUserId, updatedBookData } = req.body;

    if (!currentUserId) {
        return res.status(401).json({ error: "Unauthorized. User not logged in." });
    }

    // Check if the book exists and belongs to the logged-in user
    const { data: book, error: bookError } = await supabase
        .from("logged_books")
        .select("player_id")
        .eq("id", bookId)
        .single();

    if (bookError || !book) {
        return res.status(404).json({ error: "Book not found." });
    }

    if (book.player_id !== currentUserId) {
        return res.status(403).json({ error: "You can only edit books you've submitted." });
    }

    // Update book entry in Supabase
    const { error } = await supabase
        .from("logged_books")
        .update(updatedBookData)
        .eq("id", bookId);

    if (error) {
        return res.status(500).json({ error: "Failed to update book." });
    }

    res.json({ message: "Book updated successfully!" });
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});