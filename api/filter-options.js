module.exports = async (req, res) => {
  const { ORIGAMI_BASE_URL, ORIGAMI_USERNAME, ORIGAMI_API_SECRET } = process.env;

  async function fetchEntity(entity) {
    const r = await fetch(`${ORIGAMI_BASE_URL}/entities/api/instance_data/format/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ORIGAMI_USERNAME, api_secret: ORIGAMI_API_SECRET, entity_data_name: entity }),
    });
    if (!r.ok) throw new Error(`Origami ${r.status}`);
    return r.json();
  }

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

  try {
    const [citiesRaw, sourcesRaw, responsiblesRaw] = await Promise.all([
      fetchEntity('e_91'),
      fetchEntity('e_99'),
      fetchEntity('e_105'),
    ]);
    res.status(200).json({
      cities:       extractField(citiesRaw,       'שם העיר'),
      sources:      extractField(sourcesRaw,       'שם המקור'),
      responsibles: extractField(responsiblesRaw,  'שם מלא'),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
