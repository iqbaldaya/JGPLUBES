const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = "app.use(express.json({ limit: '10mb' }));";
const addition = `
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
`;

code = code.replace(target, target + addition);

fs.writeFileSync('server.ts', code);
