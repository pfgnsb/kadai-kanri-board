---
name: server-ports
description: >-
  課題管理ボードの開発サーバを、アプリに書いてあるポートだけで起動する。
  バックエンド、フロントエンド、Spring Boot、Vite、localhost:8080、localhost:5173
  の起動、再起動、ポート競合のときに使う。別ポートへの退避はしない。
---

# サーバのポート

起動するポートは、アプリに書いてある番号だけを使う。空いている別のポートへ移して起動しない。

| サーバ | 設定 | ポート |
|---|---|---|
| バックエンド（Spring Boot） | `backend/src/main/resources/application.properties` の `server.port` | 8080 |
| フロントエンド（Vite） | `frontend/vite.config.js` の `server.port` | 5173 |

## 起動手順

1. 上の表のポートが使用中か確認する。
2. 使用中なら、そのポートを待っているプロセスを止める。別番号では起動しない。
3. 空いた同じ番号でサーバを起動する。
4. 待ち受けが 8080 と 5173 であることを確認する。

```powershell
foreach ($port in 8080, 5173) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
}
```

Vite の `server.strictPort` は `true` のままにする。外したり、5174 など別番号で一時起動したりしない。
