mock_provider "aws" {}

variables {
  api_core_code_hash            = "placeholder"
  api_core_package_path         = "placeholder.zip"
  api_core_reserved_concurrency = 10
  api_ia_code_hash              = "placeholder"
  api_ia_package_path           = "placeholder.zip"
  api_ia_reserved_concurrency   = 1
  audience                      = "sandbox-client-id"
  cognito_issuer                = "https://cognito-idp.us-east-1.amazonaws.com/sandbox"
  cors_allowed_origins          = ["http://localhost:5173"]
  cost_center                   = "hackathon"
  domain_table_arn              = "arn:aws:dynamodb:us-east-1:000000000000:table/domain"
  domain_table_name             = "domain"
  enable_api_stage_settings     = false
  enable_api_stage_tags         = false
  environment                   = "dev"
  hmac_secret_arn               = "arn:aws:secretsmanager:us-east-1:000000000000:secret:placeholder"
  idempotency_table_arn         = "arn:aws:dynamodb:us-east-1:000000000000:table/idempotency"
  idempotency_table_name        = "idempotency"
  owner                         = "francis"
  project                       = "ponte-trucha"
  require_web_adapter_layer     = false
  web_adapter_layer_arn         = null
}

run "rejects_an_aws_lambda_without_web_adapter" {
  command = plan

  variables {
    require_web_adapter_layer = true
  }

  expect_failures = [
    aws_lambda_function.api_core,
    aws_lambda_function.api_ia,
  ]
}

run "creates_http_api_with_jwt_and_bounded_lambdas" {
  command = plan

  assert {
    condition     = aws_apigatewayv2_api.core.protocol_type == "HTTP"
    error_message = "La API debe ser HTTP API."
  }

  assert {
    condition     = contains(one(aws_apigatewayv2_authorizer.cognito.jwt_configuration).audience, var.audience)
    error_message = "El authorizer debe validar la audiencia del cliente Cognito."
  }

  assert {
    condition     = aws_lambda_function.api_core.reserved_concurrent_executions == var.api_core_reserved_concurrency
    error_message = "api-core debe tener concurrencia reservada explícita."
  }

  assert {
    condition     = aws_lambda_function.api_ia.reserved_concurrent_executions == var.api_ia_reserved_concurrency
    error_message = "api-ia debe tener concurrencia reservada explícita."
  }

  assert {
    condition     = length(aws_apigatewayv2_stage.default.tags) == 0
    error_message = "Floci debe omitir solo tags del stage HTTP no soportados."
  }

  assert {
    condition     = length(aws_apigatewayv2_stage.default.access_log_settings) == 0
    error_message = "Floci no debe gestionar logs del stage HTTP no soportados."
  }
}

run "creates_operational_alarms_outside_floci" {
  command = plan

  variables {
    enable_operational_alarms = true
    require_web_adapter_layer = true
    web_adapter_layer_arn     = "arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerArm64:25"
  }

  assert {
    condition     = length(aws_cloudwatch_metric_alarm.lambda_throttles) == 2
    error_message = "AWS real debe vigilar throttles de ambas Lambdas."
  }
}
