output "issuer" {
  description = "Issuer esperado por el JWT authorizer de API Gateway."
  value = (
    var.issuer_base_url_override == null
    ? "https://${aws_cognito_user_pool.adults.endpoint}"
    : "${var.issuer_base_url_override}/${aws_cognito_user_pool.adults.id}"
  )
}

output "scope_names" {
  description = "Scopes del resource server, sin el identificador que los califica."
  value       = sort(keys(local.scopes))
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
