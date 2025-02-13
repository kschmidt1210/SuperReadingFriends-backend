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

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});