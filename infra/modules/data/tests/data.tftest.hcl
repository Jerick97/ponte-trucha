mock_provider "aws" {}

variables {
  cost_center = "hackathon"
  environment = "dev"
  owner       = "francis"
  project     = "ponte-trucha"
}

run "creates_two_provisioned_tables_with_ttl" {
  command = plan

  assert {
    condition     = aws_dynamodb_table.domain.billing_mode == "PROVISIONED"
    error_message = "La tabla de dominio debe iniciar con capacidad provisionada."
  }

  assert {
    condition     = aws_dynamodb_table.idempotency.ttl[0].attribute_name == "expiresAt"
    error_message = "La idempotencia debe usar expiresAt como TTL."
  }

  assert {
    condition     = aws_dynamodb_table.domain.hash_key == "PK" && aws_dynamodb_table.domain.range_key == "SK"
    error_message = "El modelo físico requiere PK y SK."
  }
}
