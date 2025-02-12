require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library'); // ✅ Import JWT for authentication
const creds = require('./google-service-account.json'); // Your Google API Credentials

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5001;
const SPREADSHEET_ID = '1ZBYG_eq4VKdTuo9GGPQIsU4k9ipcXVQP7xPCbr15UU4'; // Replace with your actual Google Sheets ID

async function getPlayersData() {
    try {
        const auth = new JWT({
            email: creds.client_email,
            key: creds.private_key.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
        await doc.loadInfo(); 

        const sheet = doc.sheetsByTitle['Players']; 
        if (!sheet) {
            throw new Error('Sheet with title "Players" not found');
        }

        const rows = await sheet.getRows();

        // ✅ Debugging: Log the first row's raw data to ensure correct indexing
        if (rows.length > 0) {
            console.log("🔹 First Row Raw Data:", rows[0]._rawData);
        }

        // ✅ Extracting column values using raw data
        return rows.map(row => ({
            playerID: row._rawData[0], // First column (PlayerID)
            playerName: row._rawData[1], // Second column (PlayerName)
            playerEmail: row._rawData[2] // Third column (PlayerEmail)
        }));
    } catch (error) {
        console.error('❌ Error fetching data:', error.message);
        return [];
    }
}

app.get('/api/players', async (req, res) => {
    const data = await getPlayerData();
    res.json({ players: data });
});

async function getFriendsData() {
    try {
        const auth = new JWT({
            email: creds.client_email,
            key: creds.private_key.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
        await doc.loadInfo();

        const sheet = doc.sheetsByTitle['Friends'];
        if (!sheet) {
            throw new Error('Sheet with title "Friends" not found');
        }

        const rows = await sheet.getRows();

        return rows.map(row => ({
            name: row._rawData[0], // "Name"
            pages: row._rawData[1], // "Pages"
            bookOnlyPages: row._rawData[2], // "Book Only Pages"
            booksCounted: row._rawData[3], // "Books Counted"
            booksCompleted: row._rawData[4], // "Books Completed"
            preBonusPoints: row._rawData[5], // "Pre-Bonus Points"
            alphabetChallenge: row._rawData[6], // "Alphabet Challenge?"
            genreChallenge: row._rawData[7], // "Genre Challenge"
            womenChallenge: row._rawData[8], // "Women Challenge?"
            differentCountries: row._rawData[9], // "# of Different Countries?"
            countryBonus: row._rawData[10], // "Country Bonus"
            longestSeries: row._rawData[11], // "Longest Series"
            seriesBonus: row._rawData[12], // "Series Bonus"
            totalPoints: row._rawData[13], // "Total Points"
            avgBookLength: row._rawData[14], // "Avg. Book Length"
            avgPointsPerBook: row._rawData[15], // "Avg. Points/Book"
            highestPointBook: row._rawData[16], // "Highest-Point Book"
            highestPointBookValue: row._rawData[17], // "Highest-Point Book Value"
            highestRatedBook: row._rawData[18], // "Highest-Rated Book"
            highestRatedBookRating: row._rawData[19] // "Highest-Rated Book Rating"
        }));
    } catch (error) {
        console.error('❌ Error fetching friends data:', error.message);
        return [];
    }
}

app.get('/api/friends', async (req, res) => {
    const data = await getFriendsData();
    res.json({ friends: data });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});