# PostgreSQL は公開しない。5432 は EC2 のセキュリティグループからだけ許可する。

resource "aws_db_subnet_group" "task_board" {
  name       = "task-board"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "task-board"
  }
}

resource "aws_security_group" "task_board_db" {
  name        = "task-board-db"
  description = "PostgreSQL from the task board EC2 only."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "PostgreSQL from task board EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.task_board.id]
  }

  tags = {
    Name = "task-board-db"
  }
}

resource "aws_db_instance" "task_board" {
  identifier     = "task-board"
  engine         = "postgres"
  engine_version = "16.15"
  instance_class = "db.t4g.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.task_board.name
  vpc_security_group_ids = [aws_security_group.task_board_db.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period      = 1
  skip_final_snapshot          = true
  deletion_protection          = false
  performance_insights_enabled = false

  tags = {
    Name = "task-board"
  }
}
