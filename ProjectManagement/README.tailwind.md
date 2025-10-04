Tailwind integration notes

1. Install dev dependencies (Node.js and npm required):
   npm install

2. Build CSS once:
   npm run build:css

3. Watch CSS during development:
   npm run watch:css

Files created:
- `Assets/css/input.css` : Tailwind input file
- `tailwind.config.cjs` : Tailwind configuration
- `package.json` : npm scripts and devDependencies
- `wwwroot/css/site.css` : generated output (created when you run the build)
- `wwwroot/index.html` : demo page served by the ASP.NET Core app

Program.cs updated to serve static files from wwwroot.
