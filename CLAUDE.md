# サーバのポート

バックエンドとフロントエンドは、アプリに書いてあるポートだけで起動する。ポートが使用中でも、別の番号には移さない。

| サーバ | 設定 | ポート |
|---|---|---|
| バックエンド（Spring Boot） | `backend/src/main/resources/application.properties` の `server.port` | 8080 |
| フロントエンド（Vite） | `frontend/vite.config.js` の `server.port` | 5173 |

使用中なら、そのポートを待っているプロセスを止めてから、同じ番号で起動する。

```powershell
$conn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

5173 も同じである。Vite の `strictPort` は外さない。5174 など別ポートでの一時起動はしない。
