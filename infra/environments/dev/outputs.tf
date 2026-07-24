output "api_endpoint" {
  description = "Endpoint HTTP de api-core en el ambiente dev."
  value       = module.api.api_endpoint
}

output "cognito_spa_client_id" {
  description = "Client ID OAuth público de Cognito para desarrollo."
  value       = module.identity.spa_client_id
}

output "cognito_user_pool_id" {
  description = "User Pool de cuentas adultas del ambiente dev."
  value       = module.identity.user_pool_id
}
