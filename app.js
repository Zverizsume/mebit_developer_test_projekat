const express = require('express')
const app = express()
const PORT = process.env.PORT || 3009

const {
  createTables,
  insertUsernames,
  getAllUsernames,
  countUsernamesLastHour,
  countUsernamesPerHourLast10Hours,
  checkUsernamesAtCompetition,
  dropTables,
  getAllCompetitorUsernames
} = require('./db_functions')

const { startScraping, stopScraping } = require('./stakeUsernameScraper')

app.use(express.json())

app.use((req, res, next) => {
  console.log(`Received ${req.method} request on ${req.url}`)
  next()
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Stake Scraper API',
    routes: {
      GET: {
        '/': 'API index with available routes.',
        '/usernames': 'List all usernames in stake_players table.',
        '/usernames/last-hour': 'Count of usernames scraped in the last hour.',
        '/usernames/per-hour-last-10': 'Username counts per hour for the last 10 hours.'
      },
      POST: {
        '/create-tables': 'Create the neccessery tables for the project.',
        '/drop-tables': 'Empty tables.',
        '/usernames': 'Insert usernames manually into stake_players (JSON body: [{ username, date }]).',
        '/check-competitor' : `Checks if any usernames from the stake_players table exist on a competitor's website. If a match is found, the username and associated wager are inserted into the stake_competitor_players table.`,
        '/start-scraping' : 'Start scraping usernames from the Stake.com website, additionally you are able to set the scraping interval in seconds.',
        '/stop-scraping' : 'Stop scraping usernames from the Stake.com website.'
      }
    }
  });
});

app.get('/scraped-usernames', async (req, res) => {

  try {

    const usernames = await getAllUsernames()
    res.json(usernames)

  } catch (err) {

    console.error('Error fetching usernames:', err)
    res.status(500).json({ error: 'Internal Server Error' })

  }

})

app.get('/competitor-usernames', async (req, res) => {

  try {

    const competitorUsernames = await getAllCompetitorUsernames()
    res.json(competitorUsernames)

  } catch (err) {

    console.error('Error fetching competitor usernames:', err)
    res.status(500).json({ error: 'Internal Server Error' })

  }

})

app.get('/usernames/last-hour', async (req, res) => {

  try {

    const count = await countUsernamesLastHour()
    res.json({ usernames_last_hour: count })

  } catch (err) {

    console.error('Error fetching last hour count:', err)
    res.status(500).json({ error: 'Internal Server Error' })

  }
  
})

app.get('/usernames/per-hour-last-10', async (req, res) => {

  try {

    const data = await countUsernamesPerHourLast10Hours()
    res.json(data);

  } catch (err) {

    console.error('Error fetching per hour counts:', err)
    res.status(500).json({ error: 'Internal Server Error' })

  }

})

app.post('/create-tables', async (req, res) => {

  try {

    await createTables()
    res.status(200).json({ message: 'Tables created or already exist.' })

  } catch (error) {

    console.error('Error creating tables:', error)
    res.status(500).json({ error: 'Failed to create tables.' })

  }

})

app.post('/drop-tables', async (req, res) => {

  try {

    await dropTables()
    res.status(200).json({ message: 'Tables dropped successfully.' })

  } catch (error) {

    console.error('Error dropping tables:', error)
    res.status(500).json({ error: 'Failed to drop tables.' })

  }

})

// function that generates users for testing the /usernames/per-hour-last-10 get call

function generateBatchUsers() {

  const now = new Date()
  const users = []

  for (let i = 0; i < 10; i++) {
    const baseDate = new Date(now.getTime() - i * 60 * 60 * 1000) // i hours ago

    users.push({
      username: `User_${i * 2 + 1}`,
      date: new Date(baseDate)
    })

    users.push({
      username: `User_${i * 2 + 2}`,
      date: new Date(baseDate.getTime() + 5 * 60 * 1000) // 5 mins after first user
    })
  }

  return users.reverse() // from oldest to newest
}

app.post('/usernames', async (req, res) => {

  const { usernames } = req.body

  if (!Array.isArray(usernames) || usernames.length === 0){

    return res.status(400).json({ error: 'usernames must be an array of { username, date } and not empty' });

  }

  const validUsers = usernames.filter(({ username, date }) => {

    return (
      typeof username === 'string' &&
      username.trim().length > 0 &&
      !Number.isNaN(new Date(date).getTime())
    )

  })

  if (validUsers.length === 0) {

    return res.status(400).json({ error: 'No valid user entries found' })

  }

  try {

    const inserted = await insertUsernames(validUsers)

    res.json({

      insertedCount: inserted.length,
      skippedCount: usernames.length - inserted.length,
      inserted

    })

  } catch (err) {

    console.error('Error inserting:', err)
    res.status(500).json({ error: 'Failed to insert usernames' })

  }
})

app.post('/check-competitor', async (req, res) => {

  try{

    const result = await checkUsernamesAtCompetition()

    res.status(200).json({ result })

  } catch ( error ) {

    res.status(500).json({ error: 'Internal Server Error', desc: error })

  }

})

app.post('/start-scraping', async (req, res) => {

  startScraping();
  res.json({ message: 'Scraping started.' })

});

app.post('/stop-scraping', async (req, res) => {

  await stopScraping();
  res.json({ message: 'Scraping stopped.' })

});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});