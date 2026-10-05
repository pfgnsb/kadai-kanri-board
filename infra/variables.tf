variable "instance_type" {
  description = "動作確認用の EC2。無料プランで使える t4g.small（2GB）を初期値にする。"
  type        = string
  default     = "t4g.small"
}
