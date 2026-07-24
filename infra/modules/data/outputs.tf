output "domain_table_arn" {
  description = "ARN de la tabla de dominio para permisos mínimos de api-core."
  value       = aws_dynamodb_table.domain.arn
}

output "domain_table_name" {
  description = "Nombre de la tabla de dominio."
  value       = aws_dynamodb_table.domain.name
}

output "idempotency_table_arn" {
  description = "ARN de la tabla de idempotencia para permisos mínimos de api-core."
  value       = aws_dynamodb_table.idempotency.arn
}

output "idempotency_table_name" {
  description = "Nombre de la tabla de idempotencia."
  value       = aws_dynamodb_table.idempotency.name
}
