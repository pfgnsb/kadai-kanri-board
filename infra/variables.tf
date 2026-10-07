variable "instance_type" {
  description = "動作確認用の EC2。無料プランで使える t4g.small（2GB）を初期値にする。"
  type        = string
  default     = "t4g.small"
}

variable "allowed_cidr" {
  description = "入ってくる接続を許すアドレス。この PC の公開アドレスを /32 で書く。値は terraform.tfvars に置く。"
  type        = string
}

variable "db_name" {
  description = "RDS に最初から作るデータベース名。"
  type        = string
  default     = "task_board"
}

variable "db_username" {
  description = "RDS の管理者ユーザー名。"
  type        = string
  default     = "task_board"
}

variable "db_password" {
  description = "RDS の管理者パスワード。値は terraform.tfvars に置く。"
  type        = string
  sensitive   = true
}
