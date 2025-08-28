export default async function handler(req, res) {
  const signalingServer = process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'http://localhost:5000';
  try {
    const response = await fetch(`${signalingServer}/health`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ ok: false, error: 'Upstream error', details: data });
    }
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res.status(503).json({ ok: false, error: error.message });
  }
}


