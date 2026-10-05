# この段階で作るのは EC2 1 台だけである。
# 画面と API は、あとでこの同じサーバに置く。RDS、S3、CloudFront はまだ作らない。
# 外から入れるポートは、この PC からの 22（SSH）、80（nginx）、5173（画面）、8080（API）だけである。

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-*-arm64"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "task_board" {
  name        = "task-board-ec2"
  description = "Task board EC2. Inbound is this PC only, on 22, 5173, and 8080."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH from this PC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  ingress {
    description = "nginx from this PC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  ingress {
    description = "Frontend from this PC"
    from_port   = 5173
    to_port     = 5173
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  ingress {
    description = "API from this PC"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }

  # これはサーバから外へ出る向きである。SSM が AWS へ届くために残す。
  # 外から入る接続は、上の 22、80、5173、8080 だけである。
  egress {
    description = "Outbound for SSM"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "task-board-ec2"
  }
}

resource "aws_iam_role" "task_board" {
  name = "task-board-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.task_board.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "task_board" {
  name = "task-board-ec2"
  role = aws_iam_role.task_board.name
}

resource "aws_key_pair" "task_board" {
  key_name   = "task-board-ec2"
  public_key = file("${path.module}/keys/task-board.pub")
}

resource "aws_instance" "task_board" {
  ami                         = data.aws_ami.amazon_linux_2023.id
  instance_type               = var.instance_type
  subnet_id                   = sort(data.aws_subnets.default.ids)[0]
  vpc_security_group_ids      = [aws_security_group.task_board.id]
  iam_instance_profile        = aws_iam_instance_profile.task_board.name
  key_name                    = aws_key_pair.task_board.key_name
  associate_public_ip_address = true

  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  tags = {
    Name = "task-board"
  }
}
