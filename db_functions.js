const pool = require('./db')
const scrapeConcurrency = require('./scrapeConcurrency')

const createTablesSql = `
    CREATE TABLE IF NOT EXISTS stake_players (
    username VARCHAR(255) PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stake_competitor_players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) REFERENCES stake_players(username),
    competitor_name VARCHAR(50) CHECK (competitor_name IN ('SHUFFLE', 'BCGAME')),
    wager NUMERIC,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`

async function createTables() {

  try {

    await pool.query(createTablesSql)
    console.log('Tables created or already exist.')

  } catch (error) {

    console.error('Error creating tables:', error.message)
    throw error

  }

}

async function dropTables() {

  try {

    await pool.query('DROP TABLE IF EXISTS stake_competitor_players')
    await pool.query('DROP TABLE IF EXISTS stake_players')

    console.log('Tables dropped')

  } catch (error) {

    console.error('Error dropping tables:', error.message)
    throw error

  }
  
}

async function getAllUsernames() {

  const sql = `
    SELECT username, date
    FROM stake_players
    ORDER BY date DESC
  `

  try {

    const result = await pool.query(sql)
    return result.rows

  } catch (err) {

    console.error('Error fetching all usernames:', err)
    throw err

  }
}

async function getAllCompetitorUsernames() {

  const sql = `
    SELECT username, competitor_name, wager
    FROM stake_competitor_players
    ORDER BY date DESC
  `

  try {

    const result = await pool.query(sql)
    return result.rows

  } catch (err) {

    console.error('Error fetching all usernames:', err)
    throw err

  }
}

async function countUsernamesLastHour() {

  const sql = `
    SELECT COUNT(*) AS usernames_last_hour
    FROM stake_players
    WHERE date >= NOW() - INTERVAL '1 hour';
  `

  try {

    const result = await pool.query(sql);
    return result.rows[0].usernames_last_hour

  } catch (err) {

    console.error('Error running countUsernamesLastHour:', err)
    throw err

  }
}

async function countUsernamesPerHourLast10Hours() {

  const sql = `
    SELECT
      EXTRACT(HOUR FROM date) AS hour,
      COUNT(*) AS username_count
    FROM stake_players
    WHERE date >= NOW() - INTERVAL '10 hours'
    GROUP BY hour
    ORDER BY hour DESC;
  `

  try {

    const { rows } = await pool.query(sql)

    return rows.map(row => ({

      hour: parseInt(row.hour),
      username_count: parseInt(row.username_count)

    }))

  } catch (err) {

    console.error('Error running countUsernamesPerHourLast10Hours:', err)
    throw err

  }
}

async function insertUsernames(players) {

  const values = []
  const placeholders = []

  players.forEach((player, index) => {
    const baseIndex = index * 2
    placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2})`)
    values.push(player.username, player.date)
  });

  const sql = `
    INSERT INTO stake_players (username, date)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (username) DO NOTHING
    RETURNING *;
  `

  try {

    const result = await pool.query(sql, values)
    return result.rows || null

  } catch (err) {

    console.error('Error inserting usernames:', err)
    throw err

  }
}

async function checkUsernamesAtCompetition() {

    try {

        const foundUsers = [];

        const competitorName = "SHUFFLE"

        const users = await getAllUsernames()
        const stakeUsernames = users.map( u => u.username )

        for (const username of stakeUsernames) {

        const info = await scrapeConcurrency(username)

        if (info.user) {

            const wager = parseFloat(info.wagerAmount.slice(1).replace(/,/g, '')) // remove $ symbol and "," from the string and parse it to float

            await pool.query(

            `INSERT INTO stake_competitor_players (username, competitor_name, wager, date)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT DO NOTHING`,
            [username, competitorName, wager]

            );

            foundUsers.push({ username, wager })

        }

        }

        return foundUsers

    } catch ( error ) {

        console.error('Error syncing competitor users:', error)
        throw error

    }

}

module.exports = {

  checkUsernamesAtCompetition,
  createTables,
  dropTables,
  insertUsernames,
  getAllUsernames,
  getAllCompetitorUsernames,
  countUsernamesLastHour,
  countUsernamesPerHourLast10Hours

};
