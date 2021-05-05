require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.get('/get-historical-prices', async (req, res) => {
  const marketName = 'BTC';
  const resolution = 3600; // 1 hour
  const limit = 5000; // defaults to 1500

  let data = [];
  let endTime;

  while (true) {
    console.log('QUERY');
    const response = await axios.get(
      `${process.env.API_ENDPOINT}/indexes/${marketName}/candles`,
      {
        params: {
          resolution: resolution,
          end_time: endTime ? endTime : undefined,
          limit: limit,
          // start_time:
        },
      },
    );

    // Exit loop once no more results are returned.
    if (response.data.result.length === 0) {
      break;
    }

    // Merge response with past request iterations.
    data = [...response.data.result, ...data];

    // Convert UTC time to seconds from milliseconds and - 1 second to stop getting a result double from the result
    // item whose startTime we are reading from.
    endTime = new Date(response.data.result[0].startTime).getTime() / 1000 - 1;
  }

  return res.send(data);
});
