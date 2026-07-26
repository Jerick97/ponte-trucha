output "api_endpoint" {
  description = "URL base de la HTTP API de api-core."
  value       = aws_apigatewayv2_api.core.api_endpoint
}

output "api_core_function_name" {
  description = "Nombre de la Lambda api-core."
  value       = aws_lambda_function.api_core.function_name
}

output "api_ia_function_name" {
  description = "Nombre de la Lambda api-ia sin Bedrock habilitado."
  value       = aws_lambda_function.api_ia.function_name
}

output "local_jwt_bridge_enabled" {
  description = "Indica si las Lambdas verifican el token localmente (solo emulador)."
  value       = var.local_jwt_claims != null
}
