# AWSデプロイガイド

| 項目 | 内容 |
|---|---|
| 文書名 | AWSデプロイガイド |
| 対象システム | 課題管理ボード（Trello風タスク管理アプリ） |
| 版 | 1.0 |
| 作成日 | 2026年10月7日 |
| 改訂日 | 2026年10月7日 |
| 作成者 | nsb |
| 関連資料 | 用語定義書、技術スタック、操作手順書 |
| 目的 | EC2 1台に画面と API を載せ、保存を RDS にする手順を示す |

言葉の意味は「用語定義書」に従う。手元のパソコンで Docker の PostgreSQL と Vite を起動する手順は、この資料の対象外である。その開き方は「操作手順書」と「Spring Boot バックエンド初期セットアップ」である。

この資料のデプロイは、東京リージョンの EC2 と RDS に、いま動いている形を載せることである。ログインはない。利用者はこの PC だけを想定する。

---

## 1. 何を置くか

画面と API は、同じ EC2 に置く。入口は nginx の 80 番だけにする。API は 8080 のまま、EC2 の中から渡す。PostgreSQL は RDS で、EC2 からだけ接続する。

```text
この PC のブラウザ
  └─ http://EC2の公開アドレス/     nginx（80）
        ├─ 画面のファイル           /usr/share/nginx/html
        └─ /api/*                   Spring Boot（127.0.0.1:8080）
                                      └─ RDS（公開しない。5432 は EC2 からだけ）
```

| 役割 | 置き場所 | 版の目安 |
|---|---|---|
| 画面 | EC2 の nginx。手元で `npm run build` した `frontend/dist` | Node.js は手元で使う |
| API | EC2 の `/opt/task-board/task-board.jar` | Java 21（Amazon Corretto）、Spring Boot 4.1.1 |
| 保存 | RDS。識別子 `task-board` | PostgreSQL 16.15、`db.t4g.micro`、gp3 20GB |
| 土台 | `infra/` の Terraform | リージョンは `ap-northeast-1`。既定の VPC |

EC2 のインスタンス型は `t4g.small` である。画面の開発サーバ（Vite の 5173）は EC2 では起動しない。

画面は同じホストの `/api` を呼ぶ。`frontend/src/api.js` の `API_BASE` は空である。手元の Vite は `/api` を `http://localhost:8080` へ渡す。この形でない画面を EC2 に置くと、ブラウザが自分のパソコンの 8080 を呼んでしまう。

---

## 2. 接続を許す範囲

Terraform のセキュリティグループが正である。値の置き場所は `infra/terraform.tfvars` の `allowed_cidr` で、この PC の公開アドレスを `/32` で書く。このファイルは Git に入れない。

| ポート | 許可する相手 | 用途 |
|---|---|---|
| 22 | この PC だけ | SSH。ユーザーは `ec2-user` |
| 80 | この PC だけ | nginx。ブラウザの入口 |
| 8080 | この PC だけ | API を直接確認するとき |
| 5173 | この PC だけ | EC2 では使わない。手元の Vite 用に開けてある |
| 5432 | EC2 のセキュリティグループだけ | RDS。IP アドレスでは開けない |

RDS の公開設定はオフである。名前は VPC の中のプライベートアドレスに解決される。この PC から 5432 へは届かない。

回線のアドレスが変わったら、`allowed_cidr` を直して `terraform apply` する。直すまで、ブラウザも SSH も届かない。

---

## 3. 事前に要るもの

| もの | 置き場所 | Git |
|---|---|---|
| AWS CLI の認証 | この PC。リージョンは `ap-northeast-1` | 入れない |
| Terraform | `infra/` | 定義は入れる。状態ファイルは入れない |
| JDK 21 | 手元。jar を作る | |
| Node.js | 手元。画面をビルドする | |
| SSH の秘密鍵 | `infra/keys/task-board` | 入れない |
| RDS のパスワード | `infra/terraform.tfvars` の `db_password` | 入れない |

`infra/terraform.tfvars` の例は次である。パスワードの実値はここに書かない。

```text
allowed_cidr = "このPCの公開アドレス/32"
db_password  = "英数字のパスワード"
```

データベース名とユーザー名の初期値は `task_board` である。定義は `infra/variables.tf` にある。

---

## 4. AWS の土台を作る

`infra` で次を実行する。

```powershell
terraform init
terraform apply
```

できるものは EC2、そのセキュリティグループ、SSH の公開鍵、RDS、RDS 用のセキュリティグループである。RDS の作成には 10 分近くかかることがある。

終わったら、次で公開アドレスと RDS のホスト名を見る。

```powershell
terraform output public_ip
terraform output db_endpoint
```

公開アドレスは、インスタンスを止めて起動し直すと変わる。

---

## 5. API を載せる

### 5.1 EC2 に Java を入れる

SSH の秘密鍵は `infra/keys/task-board` である。

```powershell
ssh -i infra\keys\task-board ec2-user@公開アドレス
```

EC2 の中で、次を実行する。

```bash
sudo dnf install -y java-21-amazon-corretto-headless
java -version
```

### 5.2 jar を手元で作り、コピーする

手元の `backend` で次を実行する。

```powershell
.\mvnw.cmd package
```

できた `backend\target\task-board-0.0.1-SNAPSHOT.jar` を、EC2 の `/opt/task-board/task-board.jar` に置く。ディレクトリの所有者は `ec2-user` にする。

### 5.3 RDS への接続を書く

`/opt/task-board/task-board.env` を作り、権限は `600` にする。改行は LF だけにする。Windows の CRLF のまま置くと、ユーザー名の末尾に余分な文字が付き、RDS が認証に失敗する。

```text
DB_HOST=RDSのホスト名
DB_PORT=5432
DB_NAME=task_board
DB_USER=task_board
DB_PASSWORD=terraform.tfvars のパスワード
SPRING_DOCKER_COMPOSE_ENABLED=false
SPRING_DATASOURCE_URL=jdbc:postgresql://RDSのホスト名:5432/task_board?sslmode=require
```

`SPRING_DOCKER_COMPOSE_ENABLED=false` は、EC2 で手元用の Docker を起動しないためのものである。パスワードはこのファイルにだけ置き、Git には入れない。

起動すると `schema.sql` と `data.sql` が実行される。どちらも、既にある行は残す書き方である。

### 5.4 サービスにする

`/etc/systemd/system/task-board.service` を次の内容にする。

```text
[Unit]
Description=Task board API
After=network-online.target
Wants=network-online.target

[Service]
User=ec2-user
WorkingDirectory=/opt/task-board
EnvironmentFile=/opt/task-board/task-board.env
ExecStart=/usr/bin/java -Xmx512m -jar /opt/task-board/task-board.jar
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

有効にして起動する。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now task-board
```

確認は次である。EC2 の中と、この PC の両方で、同じ JSON が返ればよい。

```bash
curl -s http://127.0.0.1:8080/api/health
```

```powershell
curl.exe -s http://公開アドレス:8080/api/health
```

期待する本文は `{"status":"ok","database":"up"}` である。

---

## 6. 画面を載せる

手元の `frontend` で次を実行する。

```powershell
npm run build
```

`frontend\dist` の中身を、EC2 の `/usr/share/nginx/html/` に置く。ディレクトリが他のユーザーから辿れるようにする。Windows からコピーするとディレクトリの権限が `700` 相当になり、nginx が 403 を返すことがある。

```bash
sudo chmod -R a+rX /usr/share/nginx/html
```

`/etc/nginx/default.d/task-board.conf` を次の内容にする。既定のサーバは 80 番で、このファイルを読み込む。

```text
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

反映する。

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

## 7. 確認

この PC のブラウザで `http://公開アドレス/` を開く。

次を見れば、載ったと判断する。

1. 見出しが「課題管理」である
2. 初期のリスト「未着手」「作業中」「完了」が見える
3. リストかカードを1つ足し、開き直しても残る
4. `http://公開アドレス/api/health` が `{"status":"ok","database":"up"}` を返す

nginx の初期画面「Welcome to nginx!」のままなら、`dist` のコピーか、ディレクトリの権限を見直す。

---

## 8. 止める、消す、作り直す

チャットや SSH を閉じても、EC2 と RDS は止まらない。

| 操作 | その後 |
|---|---|
| EC2 を停止する | サーバ代と公開アドレスの消費は止まる。ディスクは残る。公開アドレスは、次に起動すると変わる |
| EC2 を起動する | `terraform apply` のあと、この PC のアドレスが変わっていれば `allowed_cidr` を直す |
| `terraform destroy` | EC2 のディスクも消える。RDS の最終スナップショットは残さない。その後、この構成で減り続けるクレジットはない |

作り直すときは、第4章の `terraform apply` のあと、第5章と第6章をもう一度行う。Terraform が作り直すのは EC2 と RDS までである。Java、nginx、jar、画面のファイル、`task-board.env`、systemd のユニットは、EC2 の中で入れ直す。

消さずに残しておくものは、`infra/keys/task-board` と `infra/terraform.tfvars` である。この2つが無いと、同じ鍵とパスワードでは戻れない。

RDS を停止した場合、AWS は最長7日で自動的に起動し直す。クレジットを止めるときは、停止ではなく `terraform destroy` を使う。

アカウントが無料プランのままなら、クレジットカードへの請求は来ない。起動中の EC2 と RDS は、無料プランのクレジットを消費する。

---

## 9. 改訂履歴

| 版 | 日付 | 内容 |
|---|---|---|
| 1.0 | 2026年10月7日 | 初版。EC2 1台に画面と API を載せ、RDS は EC2 からだけ接続する |
