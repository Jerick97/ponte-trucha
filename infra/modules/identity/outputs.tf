output "issuer" {
  description = "Issuer esperado por el JWT authorizer de API Gateway."
  value       = "https://${aws_cognito_user_pool.adults.endpoint}"
}

output "resource_server_identifier" {
  description = "Identificador del resource server usado para calificar los scopes OAuth."
  value       = local.resource_server_identifier
}

output "spa_client_id" {
  description = "ID público del app client OAuth de la SPA."
  value       = aws_cognito_user_pool_client.spa.id
}

output "user_pool_id" {
  description = "ID del User Pool exclusivo para cuentas adultas."
  value       = aws_cognito_user_pool.adults.id
}
