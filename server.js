const express = require('express');
const { stream } = require('undici');
const path = require('path');
const app = express();
const router = express.Router();

router.get('/:file(*)?', async (req, res) => {
    // リクエストされたファイル名を取得（空ならindex.html）
    const fileName = req.params.file || 'index.html';
    
    // GitHubのRawデータURLを構築
    const targetUrl = `https://raw.githubusercontent.com/Gr4ys0n/Gr4ys0n.github.io/main/public/assets/games/yohoho-io/${fileName}`;

    try {
        await stream(targetUrl, {
            method: 'GET',
            maxRedirections: 3,
        }, ({ statusCode, headers }) => {
            // 200 OK 以外は404エラーとして返す
            if (statusCode !== 200) {
                res.status(statusCode).send('Resource not found');
                return;
            }

            // 拡張子からContentTypeを判定（元のコードの仕様を維持しつつ補強）
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

            // ヘッダーの設定
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

// 作成したルーターを適用
app.use('/', router);

// サーバーをポート3000で起動
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
