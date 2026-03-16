const pool = require('./db');

pool.query('SELECT id, titre, image FROM articles WHERE image IS NOT NULL AND image NOT LIKE 'http%' LIMIT 5')
    .then(([rows]) => {
        console.log('Articles with local images:', rows);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });