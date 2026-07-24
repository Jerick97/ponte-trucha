locals {
  api_core_name = "ptk-api-core-${var.environment}"
  api_ia_name   = "ptk-api-ia-${var.environment}"
  lambda_assume_role_policy = jsonencode({
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
    Version = "2012-10-17"
  })
  tags = {
    CostCenter  = var.cost_center
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_log_group" "api_core" {
  name              = "/aws/lambda/${local.api_core_name}"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "api_ia" {
  name              = "/aws/lambda/${local.api_ia_name}"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "http_api" {
  name              = "/aws/apigateway/${var.project}-${var.environment}"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["lambda.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_iam_role" "api_core" {
  assume_role_policy = local.lambda_assume_role_policy
  name               = "${local.api_core_name}-role"
  tags               = local.tags
}

resource "aws_iam_role" "api_ia" {
  assume_role_policy = local.lambda_assume_role_policy
  name               = "${local.api_ia_name}-role"
  tags               = local.tags
}

data "aws_iam_policy_document" "api_core" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.api_core.arn}:*"]
  }

  statement {
    actions = [
      "dynamodb:BatchWriteItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:TransactWriteItems",
      "dynamodb:UpdateItem",
    ]
    resources = [var.domain_table_arn, var.idempotency_table_arn]
  }

  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.hmac_secret_arn]
  }
}

data "aws_iam_policy_document" "api_ia" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.api_ia.arn}:*"]
  }
}

resource "aws_iam_role_policy" "api_core" {
  name   = "${local.api_core_name}-least-privilege"
  policy = data.aws_iam_policy_document.api_core.json
  role   = aws_iam_role.api_core.id
}

resource "aws_iam_role_policy" "api_ia" {
  name   = "${local.api_ia_name}-logs-only"
  policy = data.aws_iam_policy_document.api_ia.json
  role   = aws_iam_role.api_ia.id
}

resource "aws_lambda_function" "api_core" {
  architectures                  = ["arm64"]
  filename                       = var.api_core_package_path
  function_name                  = local.api_core_name
  handler                        = "run.sh"
  memory_size                    = 512
  reserved_concurrent_executions = var.api_core_reserved_concurrency
  role                           = aws_iam_role.api_core.arn
  runtime                        = "python3.14"
  source_code_hash               = var.api_core_code_hash
  timeout                        = 15

  environment {
    variables = merge(
      {
        DOMAIN_TABLE_NAME      = var.domain_table_name
        HMAC_SECRET_ARN        = var.hmac_secret_arn
        IDEMPOTENCY_TABLE_NAME = var.idempotency_table_name
      },
      var.web_adapter_layer_arn == null ? {} : {
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"
        AWS_LWA_PORT            = "8080"
      },
    )
  }

  layers = var.web_adapter_layer_arn == null ? [] : [var.web_adapter_layer_arn]
  tags   = local.tags

  lifecycle {
    precondition {
      condition     = !var.require_web_adapter_layer || var.web_adapter_layer_arn != null
      error_message = "AWS real requiere web_adapter_layer_arn para iniciar FastAPI con Lambda Web Adapter."
    }
  }

  depends_on = [aws_cloudwatch_log_group.api_core, aws_iam_role_policy.api_core]
}

resource "aws_lambda_function" "api_ia" {
  architectures                  = ["arm64"]
  filename                       = var.api_ia_package_path
  function_name                  = local.api_ia_name
  handler                        = "run.sh"
  memory_size                    = 512
  reserved_concurrent_executions = var.api_ia_reserved_concurrency
  role                           = aws_iam_role.api_ia.arn
  runtime                        = "python3.14"
  source_code_hash               = var.api_ia_code_hash
  timeout                        = 10

  environment {
    variables = merge(
      { API_IA_ENABLED = "false" },
      var.web_adapter_layer_arn == null ? {} : {
        AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"
        AWS_LWA_PORT            = "8080"
      },
    )
  }

  layers = var.web_adapter_layer_arn == null ? [] : [var.web_adapter_layer_arn]
  tags   = local.tags

  lifecycle {
    precondition {
      condition     = !var.require_web_adapter_layer || var.web_adapter_layer_arn != null
      error_message = "AWS real requiere web_adapter_layer_arn para iniciar FastAPI con Lambda Web Adapter."
    }
  }

  depends_on = [aws_cloudwatch_log_group.api_ia, aws_iam_role_policy.api_ia]
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = var.enable_operational_alarms ? {
    api_core = aws_lambda_function.api_core.function_name
    api_ia   = aws_lambda_function.api_ia.function_name
  } : {}

  alarm_name          = "${each.value}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }

  tags = local.tags
}

resource "aws_apigatewayv2_api" "core" {
  name          = "ptk-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["authorization", "content-type", "idempotency-key", "x-request-id"]
    allow_methods     = ["DELETE", "GET", "OPTIONS", "PATCH", "POST"]
    allow_origins     = var.cors_allowed_origins
    max_age           = 300
  }

  tags = local.tags
}

resource "aws_apigatewayv2_integration" "api_core" {
  api_id                 = aws_apigatewayv2_api.core.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api_core.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.core.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-adults"

  jwt_configuration {
    audience = [var.audience]
    issuer   = var.cognito_issuer
  }
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.core.id
  route_key = "GET /v1/health"
  target    = "integrations/${aws_apigatewayv2_integration.api_core.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.core.id
  auto_deploy = true
  name        = "$default"

  dynamic "access_log_settings" {
    for_each = var.enable_api_stage_settings ? [true] : []

    content {
      destination_arn = aws_cloudwatch_log_group.http_api.arn
      format = jsonencode({
        requestId = "$context.requestId"
        routeKey  = "$context.routeKey"
        status    = "$context.status"
      })
    }
  }

  dynamic "default_route_settings" {
    for_each = var.enable_api_stage_settings ? [true] : []

    content {
      detailed_metrics_enabled = false
      throttling_burst_limit   = 20
      throttling_rate_limit    = 10
    }
  }

  lifecycle {
    ignore_changes = [tags]
  }

  tags = var.enable_api_stage_tags ? local.tags : {}
}

resource "aws_lambda_permission" "api_gateway" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_core.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.core.execution_arn}/*/*"
  statement_id  = "AllowHttpApiInvoke"
}
