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

app.post('/api/calculate-points', async (req, res) => {
    try {
        console.log("📥 Received request to calculate points:", req.body); // ✅ Log incoming data
        
        const { pages, year_published, completed, fiction_nonfiction, female_author, 
                hometown_bonus, bonus_1, bonus_2, bonus_3, deductions } = req.body;

        // Ensure required fields are present
        if (typeof pages !== "number" || typeof year_published !== "number") {
            console.error("❌ Missing or incorrect fields:", req.body);
            return res.status(400).json({ error: "Invalid request. Ensure all required fields are provided and are the correct data types." });
        }

        // Call the Supabase function
        const { data, error } = await supabase.rpc('calculate_points', {
            pages,
            year_published,
            completed,
            fiction_nonfiction,
            female_author,
            hometown_bonus,
            bonus_1,
            bonus_2,
            bonus_3,
            deductions
        });

        if (error) {
            console.error("❌ Supabase error:", error);
            return res.status(500).json({ error: error.message });
        }

        console.log("✅ Points Calculation Result:", data);
        res.json({ points: data.final_points });

    } catch (err) {
        console.error("❌ Internal Server Error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});