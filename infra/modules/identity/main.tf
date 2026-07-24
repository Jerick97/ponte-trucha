locals {
  resource_server_identifier = "ponte-trucha-api"
  scopes = {
    "account.delete" = "Eliminar la cuenta adulta y sus perfiles."
    "consents.read"  = "Leer consentimientos de la cuenta adulta."
    "consents.write" = "Actualizar consentimientos de la cuenta adulta."
    "game.play"      = "Emitir y responder retos del perfil autorizado."
    "profiles.read"  = "Leer perfiles infantiles propios."
    "profiles.write" = "Crear o actualizar perfiles infantiles propios."
  }
  tags = {
    CostCenter  = var.cost_center
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cognito_user_pool" "adults" {
  auto_verified_attributes = ["email"]
  name                     = "ptk-adults-${var.environment}"
  username_attributes      = ["email"]

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  tags = local.tags
}

resource "aws_cognito_resource_server" "api" {
  identifier   = local.resource_server_identifier
  name         = "Ponte Trucha API ${var.environment}"
  user_pool_id = aws_cognito_user_pool.adults.id

  dynamic "scope" {
    for_each = local.scopes

    content {
      scope_description = scope.value
      scope_name        = scope.key
    }
  }
}

resource "aws_cognito_user_pool_client" "spa" {
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = concat(["email", "openid"], [for scope_name in keys(local.scopes) : "${local.resource_server_identifier}/${scope_name}"])
  callback_urls                        = var.callback_urls
  generate_secret                      = false
  name                                 = "ptk-spa-${var.environment}"
  prevent_user_existence_errors        = "ENABLED"
  supported_identity_providers         = ["COGNITO"]
  user_pool_id                         = aws_cognito_user_pool.adults.id
}

resource "aws_cognito_user_pool_domain" "hosted_ui" {
  count        = var.enable_hosted_ui_domain && var.cognito_domain_prefix != null ? 1 : 0
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.adults.id
}
