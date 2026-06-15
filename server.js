require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.static('.'));

const BASE_URL = process.env.ORIGAMI_BASE_URL;
const USERNAME = process.env.ORIGAMI_USERNAME;
const API_SECRET = process.env.ORIGAMI_API_SECRET;

const ENTITIES = {
  leads:       'e_94',
  cities:      'e_91',
  sources:     'e_99',
  responsibles: 'e_105',
};

async function fetchEntity(entityName) {
  const res = await fetch(`${BASE_URL}/entities/api/instance_data/format/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: USERNAME,
      api_secret: API_SECRET,
      entity_data_name: entityName,
    }),
  });
  if (!res.ok) throw new Error(`Origami error: ${res.status}`);
  return res.json();
}

app.get('/api/leads', async (req, res) => {
  try {
    const data = await fetchEntity(ENTITIES.leads);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cities', async (req, res) => {
  try { res.json(await fetchEntity(ENTITIES.cities)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sources', async (req, res) => {
  try { res.json(await fetchEntity(ENTITIES.sources)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/filter-options', async (req, res) => {
  try {
    const [citiesRaw, sourcesRaw, responsiblesRaw] = await Promise.all([
      fetchEntity(ENTITIES.cities),
      fetchEntity(ENTITIES.sources),
      fetchEntity(ENTITIES.responsibles),
    ]);
    res.json({
      cities:       extractField(citiesRaw,       'שם העיר'),
      sources:      extractField(sourcesRaw,       'שם המקור'),
      responsibles: extractField(responsiblesRaw,  'שם מלא'),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function extractField(json, fieldName) {
  return (json.data || []).map(item => {
    for (const grp of item.instance_data?.field_groups || []) {
      for (const row of grp.fields_data || []) {
        for (const f of row) {
          if (f.field_name?.trim() === fieldName && f.value) return String(f.value);
        }
      }
    }
    return null;
  }).filter(Boolean).sort();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running at http://localhost:${PORT}`));
