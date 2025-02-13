require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());

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

// ✅ Fetch Books Data from `logged_books`
app.get('/api/books', async (req, res) => {
    const { data, error } = await supabase
        .from('logged_books')
        .select('*');
    if (error) {
        console.error('❌ Error fetching books:', error);
        return res.status(500).json({ error: 'Failed to fetch books' });
    }

    res.json({ books: data });
});

// Mock data to only fetch books for Josh
app.get('/api/my-books', async (req, res) => {
    const { data, error } = await supabase
        .from('logged_books')
        .select('*')
        .eq('player_name', 'Josh'); // Filter for player_name="Josh"

    if (error) {
        console.error('❌ Error fetching books:', error);
        return res.status(500).json({ error: 'Failed to fetch books' });
    }

    res.json({ books: data });
});

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

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

app.post("/api/submit-book", async (req, res) => {
    const { player_name, title, pages, year_published, completed, genre, rating, points } = req.body;

    const { data, error } = await supabase
        .from("logged_books")
        .insert([
            { player_name, title, pages, year_published, completed, genre, rating, points }
        ]);

    if (error) {
        console.error("❌ Error logging book:", error);
        return res.status(500).json({ error: "Failed to log book" });
    }

    res.status(201).json({ message: "Book submitted successfully", book: data });
});