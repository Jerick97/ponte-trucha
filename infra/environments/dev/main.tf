provider "aws" {
  region                      = var.aws_region
  skip_credentials_validation = var.use_floci
  skip_metadata_api_check     = true
  skip_requesting_account_id  = var.use_floci

  default_tags {
    tags = var.use_floci ? {} : {
      CostCenter  = var.cost_center
      Environment = "dev"
      ManagedBy   = "terraform"
      Owner       = var.owner
      Project     = var.project
    }
  }
}

resource "aws_secretsmanager_secret" "parent_ref_hmac" {
  name                    = "ptk/dev/parent-ref-hmac"
  recovery_window_in_days = 0

  tags = {
    DataClass = "secret"
  }
}

resource "aws_budgets_budget" "monthly_cost" {
  count = var.use_floci ? 0 : 1

  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_limit_usd)
  limit_unit   = "USD"
  name         = "ptk-dev-monthly-cost"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
  }

  lifecycle {
    precondition {
      condition     = length(var.budget_alert_emails) > 0
      error_message = "AWS real requiere al menos un correo operativo para las alertas de presupuesto."
    }
  }
}

module "data" {
  source = "../../modules/data"

  cost_center = var.cost_center
  environment = "dev"
  owner       = var.owner
  project     = var.project
}

module "identity" {
  source = "../../modules/identity"

  callback_urls           = var.callback_urls
  cognito_domain_prefix   = var.cognito_domain_prefix
  cost_center             = var.cost_center
  enable_hosted_ui_domain = !var.use_floci
  environment             = "dev"
  owner                   = var.owner
  project                 = var.project
}

module "api" {
  source = "../../modules/api"

  api_core_code_hash                 = filebase64sha256("${path.module}/../../.artifacts/api-core.zip")
  api_core_package_path              = "${path.module}/../../.artifacts/api-core.zip"
  api_core_reserved_concurrency      = 10
  api_ia_code_hash                   = filebase64sha256("${path.module}/../../.artifacts/api-ia.zip")
  api_ia_package_path                = "${path.module}/../../.artifacts/api-ia.zip"
  api_ia_reserved_concurrency        = 1
  audience                           = module.identity.spa_client_id
  cognito_issuer                     = module.identity.issuer
  cognito_resource_server_identifier = module.identity.resource_server_identifier
  cors_allowed_origins               = var.cors_allowed_origins
  cost_center                        = var.cost_center
  domain_table_arn                   = module.data.domain_table_arn
  domain_table_name                  = module.data.domain_table_name
  enable_api_stage_settings          = !var.use_floci
  enable_api_stage_tags              = !var.use_floci
  enable_operational_alarms          = !var.use_floci
  environment                        = "dev"
  hmac_secret_arn                    = aws_secretsmanager_secret.parent_ref_hmac.arn
  idempotency_table_arn              = module.data.idempotency_table_arn
  idempotency_table_name             = module.data.idempotency_table_name
  owner                              = var.owner
  project                            = var.project
  require_web_adapter_layer          = !var.use_floci
  web_adapter_layer_arn              = var.web_adapter_layer_arn
}
