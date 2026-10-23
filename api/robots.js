// TFTClimb – robots.txt für Suchmaschinen unter /robots.txt (Weiterleitung in vercel.json).
// Die Redaktion wird nicht indexiert, die Sitemap liegt unter der aktuell aufgerufenen Domain.
module.exports = (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const base = (req.headers['x-forwarded-proto'] || 'https') + '://' + host;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  res.status(200).send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /en/admin\n\nSitemap: ${base}/sitemap.xml\n`);
};
