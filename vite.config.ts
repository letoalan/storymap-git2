import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function serveTilesPlugin(): Plugin {
  return {
    name: 'serve-tiles-plugin',
    configureServer(server) {
      server.middlewares.use('/tiles', (req, res, next) => {
        const reqPath = (req.url || '').split('?')[0];
        const filePath = path.join(process.cwd(), 'tiles', reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Content-Type', 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

// Copie le dossier /tiles vers /dist/tiles lors du build, pour que
// GitHub Pages serve les fichiers PMTiles au même chemin qu'en dev
function copyTilesPlugin(): Plugin {
  return {
    name: 'copy-tiles-plugin',
    apply: 'build',
    closeBundle() {
      const srcDir = path.join(process.cwd(), 'tiles');
      const outDir = path.join(process.cwd(), 'dist', 'tiles');
      if (!fs.existsSync(srcDir)) return;
      fs.mkdirSync(outDir, { recursive: true });
      for (const file of fs.readdirSync(srcDir)) {
        fs.copyFileSync(path.join(srcDir, file), path.join(outDir, file));
      }
    },
  };
}

function inlineCssPlugin(): Plugin {
  return {
    name: 'inline-css-plugin',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      let cssCode = '';
      const cssKeys: string[] = [];

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          cssCode += String(chunk.source);
          cssKeys.push(fileName);
        }
      }

      for (const key of cssKeys) {
        delete bundle[key];
      }

      if (cssCode) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            const injection = `(function(){if(typeof document!=='undefined'){var s=document.createElement('style');s.setAttribute('data-storymap-git-css','');s.textContent=${JSON.stringify(cssCode)};document.head.appendChild(s);}})();\n`;
            chunk.code = injection + chunk.code;
          }
        }
      }
    },
  };
}

// Génère un index.html de démonstration dans /dist, qui charge le
// bundle IIFE final (storymap-git.js) et monte automatiquement le
// Studio complet sur #storymap-git-root, comme en dev
function generateDemoHtmlPlugin(): Plugin {
  return {
    name: 'generate-demo-html-plugin',
    apply: 'build',
    closeBundle() {
      const outDir = path.join(process.cwd(), 'dist');
      const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="StoryMap-GIT — Éditeur de cartes narratives géolocalisées pour BTS Tourisme GIT. 100% local, RGPD, sans backend." />
    <title>StoryMap-GIT — Mon Circuit Touristique</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        background: #f8fafc;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
    </style>
  </head>
  <body>
    <div id="storymap-git-root"></div>
    <script src="./storymap-git.js"></script>
  </body>
</html>`;
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // Nécessaire pour GitHub Pages : remplacer "StoryMap-GIT" par le
  // nom exact de votre repo GitHub. Sans cette ligne, les chemins
  // d'assets seront cassés une fois déployé sur
  // https://<utilisateur>.github.io/StoryMap-GIT/
  base: '/StoryMap-GIT/',
  plugins: [
    react(),
    serveTilesPlugin(),
    copyTilesPlugin(),
    inlineCssPlugin(),
    generateDemoHtmlPlugin(),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'StoryMapGIT',
      fileName: () => 'storymap-git.js',
      formats: ['iife'],
    },
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
