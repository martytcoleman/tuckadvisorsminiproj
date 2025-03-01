// Author: Marty Coleman
// Date: 2.13.25 
// Purpose: Create API to access and alter the analysis generated by custom GPT, using a database for persistent data storage

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const DB_PATH = 'TuckDatabase.db';
const DATA_JSON = path.join(__dirname, 'data.json');

app.use(express.json()); // middleware

// open/create the SQLite database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`Connected to SQLite database: ${DB_PATH}`);
  }
});

// setup the database with a new table and initial data
function setupDatabase() {
  db.run(
    `CREATE TABLE IF NOT EXISTS content_store (
      id INTEGER PRIMARY KEY,
      contentText TEXT
    )`,
    (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
        return;
      }
      // read initial JSON data from the generated file
      fs.readFile(DATA_JSON, 'utf8', (err, fileData) => {
        if (err) {
          console.error('Error reading data.json:', err.message);
          return;
        }
        let initialData;
        try {
          initialData = JSON.parse(fileData);
        } catch (parseErr) {
          console.error('Error parsing JSON:', parseErr.message);
          return;
        }
        const initialContent = initialData.gptOutput || "";
        // check if the table is empty
        db.get('SELECT COUNT(*) AS count FROM content_store', (err, row) => {
          if (err) {
            console.error('Error querying table:', err.message);
            return;
          }
          if (row.count === 0) {
            // insert the initial data if table is empty
            db.run(
              'INSERT INTO content_store (id, contentText) VALUES (1, ?)',
              [initialContent],
              (err) => {
                if (err) {
                  console.error('Error inserting initial data:', err.message);
                } else {
                  console.log('Initial data inserted successfully.');
                }
              }
            );
          }
        });
      });
    }
  );
}

// get the current content from the database
function fetchContent(callback) {
  db.get('SELECT contentText FROM content_store WHERE id = 1', (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, row ? row.contentText : "");
    }
  });
}

// GET endpoint to retrieve the current content at /api/analysis
app.get('/api/analysis', (req, res) => {
  fetchContent((err, content) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ gptOutput: content });
  });
});

// POST endpoint to append new text to the current content at /api/analysis, this expects a JSON body with a newSetnence property
app.post('/api/analysis', (req, res) => {
  const additionalText = (req.body.newSentence || "").trim();
  if (!additionalText) {
    return res.status(400).json({ error: 'No text provided' });
  }
  fetchContent((err, currentContent) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    const newContent = currentContent ? currentContent + " " + additionalText : additionalText;
    db.run(
      `INSERT OR REPLACE INTO content_store (id, contentText) VALUES (1, ?)`,
      [newContent],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({
          message: 'Content updated with new text: ' + additionalText,
          gptOutput: newContent
        });
      }
    );
  });
});

// close the database connection on process exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

// init the database and start the server on port 3000
setupDatabase();
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
