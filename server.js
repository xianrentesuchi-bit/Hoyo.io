const express = require('express');
const { stream } = require('undici');
const path = require('path');
const app = express();
const router = express.Router();

// 各ゲームのGitHub上のベースURLのマッピング
const gameUrls = {
    'yohoho-io': 'https://raw.githubusercontent.com/Gr4ys0n/Gr4ys0n.github.io/main/public/assets/games/yohoho-io',
    'poly-track': 'https://raw.githubusercontent.com/Gr4ys0n/Gr4ys0n.github.io/main/public/assets/games/poly-track',
    'subway-hawaii': 'https://raw.githubusercontent.com/Gr4ys0n/Gr4ys0n.github.io/main/public/assets/games/hawaii'
};

// メニュー画面（ルート）へのアクセスは、ローカルのpublic/index.htmlを返す
app.use(express.static(path.join(__dirname, 'public')));

// ゲームごとのリクエストを処理するルーティング
router.get('/:game/:file(*)?', async (req, res) => {
    const game = req.params.game;
    const fileName = req.params.file || 'index.html';
    
    // 定義されていないゲーム名の場合は404
    if (!gameUrls[game]) {
        res.status(404).send('Game not found');
        return;
    }

    // 選択されたゲームに応じたURLを構築
    const targetUrl = `${gameUrls[game]}/${fileName}`;

    try {
        await stream(targetUrl, {
            method: 'GET',
            maxRedirections: 3,
        }, ({ statusCode, headers }) => {
            if (statusCode !== 200) {
                res.status(statusCode).send('Resource not found');
                return;
            }

            let contentType = headers['content-type'];
            if (fileName === 'index.html' || fileName.endsWith('index.html')) {
                contentType = 'text/html';
            } else if (fileName.endsWith('.js')) {
                contentType = 'application/javascript';
            } else if (fileName.endsWith('.wasm')) {
                contentType = 'application/wasm';
            } else if (fileName.endsWith('.css')) {
                contentType = 'text/css';
            }

            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
            res.setHeader('Cache-Control', `public, max-age=31536000, immutable`);
            
            return res;
        });
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
});

app.use('/games', router);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
