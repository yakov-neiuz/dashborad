module.exports = async (req, res) => {
  const { ORIGAMI_BASE_URL, ORIGAMI_USERNAME, ORIGAMI_API_SECRET } = process.env;
  try {
    const r = await fetch(`${ORIGAMI_BASE_URL}/entities/api/instance_data/format/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ORIGAMI_USERNAME, api_secret: ORIGAMI_API_SECRET, entity_data_name: 'e_91' }),
    });
    if (!r.ok) throw new Error(`Origami ${r.status}`);
    res.status(200).json(await r.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
