---
name: server-ports
description: >
  バックエンドとフロントエンドは、アプリに書いてあるポートだけで起動する。
  サーバを起動・再起動・動作確認するとき、ポートが使用中のとき、localhost、ポート、起動、Vite、Spring Boot に触れるときは、必ずこのスキルを使う。
  空いている別のポートへ移して起動してはならない。
---

# サーバのポート

起動するポートは、アプリに書いてある番号だけを使う。

| サーバ | 設定 | ポート |
|---|---|---|
| バックエンド（Spring Boot） | `backend/src/main/resources/application.properties` の `server.port` | 8080 |
| フロントエンド（Vite） | `frontend/vite.config.js` の `server.port` | 5173 |

## 起動手順

1. 使うポートが待ち受け中なら、そのプロセスを止める。別の番号は選ばない。
2. バックエンドは 8080、フロントエンドは 5173 で起動する。
3. 待ち受け番号が表と違う場合は、そのプロセスを止めて、指定ポートで起動し直す。

```powershell
$conn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

5173 も同じ手順で空ける。Vite の `strictPort` は外さない。5174 など別ポートでの一時起動はしない。
