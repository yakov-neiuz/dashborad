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

  function normVal(v) {
    if (v && typeof v === 'object' && !Array.isArray(v) && v.text !== undefined) v = v.text;
    if (Array.isArray(v) && v.length && v[0]?.text !== undefined) v = v.map(x => x.text).join(', ');
    return (v === undefined || v === null) ? '' : String(v).trim();
  }

  function extractField(json, fieldName) {
    return (json.data || []).map(item => {
      for (const grp of item.instance_data?.field_groups || []) {
        for (const row of grp.fields_data || []) {
          for (const f of row) {
            if (f.field_name?.trim() === fieldName && f.value) return normVal(f.value);
          }
        }
      }
      return null;
    }).filter(Boolean).sort();
  }

  // Only team members whose role (fld_1509) is one of these
  const ALLOWED_ROLES = ['טלפנית', 'מנהלת מכירות'];
  function extractResponsibles(json) {
    return (json.data || []).map(item => {
      let name = null, role = null;
      for (const grp of item.instance_data?.field_groups || []) {
        for (const row of grp.fields_data || []) {
          for (const f of row) {
            if (f.field_name?.trim() === 'שם מלא' && f.value) name = normVal(f.value);
            if (f.field_data_name === 'fld_1509' && f.value) role = normVal(f.value);
          }
        }
      }
      return (name && ALLOWED_ROLES.includes(role)) ? name : null;
    }).filter(Boolean).sort();
  }

  try {
    const [citiesRaw, sourcesRaw, responsiblesRaw] = await Promise.all([
      fetchEntity('e_91'),
      fetchEntity('e_99'),
      fetchEntity('e_105'),
    ]);
    res.status(200).json({
      cities:       extractField(citiesRaw,  'שם העיר'),
      sources:      extractField(sourcesRaw,  'שם המקור'),
      responsibles: extractResponsibles(responsiblesRaw),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
