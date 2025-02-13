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
    const { data, error } = await supabase
        .from('logged_books')
        .select('player_name, points');

    if (error || !data) {
        console.error('❌ Error fetching rankings:', error || 'No data received');
        return res.status(500).json({ error: 'Failed to fetch rankings' });
    }

    // Ensure points are numbers and sum them by player
    const rankings = data.reduce((acc, book) => {
        const player = book.player_name;
        const points = Number(book.points) || 0; // Convert points to a number (fallback to 0)

        if (!acc[player]) {
            acc[player] = { player_name: player, total_points: 0 };
        }
        acc[player].total_points += points;

        return acc; // Return accumulator properly
    }, {});

    // Convert object to sorted array (highest to lowest points)
    const sortedRankings = Object.values(rankings).sort((a, b) => b.total_points - a.total_points);

    res.json({ rankings: sortedRankings });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});