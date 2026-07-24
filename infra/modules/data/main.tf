locals {
  tags = {
    CostCenter  = var.cost_center
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
    ManagedBy   = "terraform"
    DataClass   = "minimal-child-data"
  }
}

resource "aws_dynamodb_table" "domain" {
  billing_mode   = "PROVISIONED"
  hash_key       = "PK"
  name           = "ptk-domain-${var.environment}"
  range_key      = "SK"
  read_capacity  = var.domain_read_capacity
  write_capacity = var.domain_write_capacity

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_pitr
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = local.tags
}

resource "aws_dynamodb_table" "idempotency" {
  billing_mode   = "PROVISIONED"
  hash_key       = "PK"
  name           = "ptk-idempotency-${var.environment}"
  range_key      = "SK"
  read_capacity  = var.idempotency_read_capacity
  write_capacity = var.idempotency_write_capacity

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_pitr
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = local.tags
}
