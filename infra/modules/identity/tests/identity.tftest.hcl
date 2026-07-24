mock_provider "aws" {}

variables {
  callback_urls           = ["http://localhost:5173/auth/callback"]
  cognito_domain_prefix   = "ponte-trucha-dev"
  cost_center             = "hackathon"
  enable_hosted_ui_domain = false
  environment             = "dev"
  owner                   = "francis"
  project                 = "ponte-trucha"
}

run "creates_an_adult_only_public_spa_client" {
  command = plan

  assert {
    condition     = aws_cognito_user_pool_client.spa.generate_secret == false
    error_message = "El cliente público de la SPA no puede usar client secret."
  }

  assert {
    condition     = contains(aws_cognito_user_pool.adults.auto_verified_attributes, "email")
    error_message = "La cuenta adulta debe verificar email en Cognito."
  }

  assert {
    condition     = length(aws_cognito_resource_server.api.scope) == 6
    error_message = "El resource server debe declarar los seis scopes cerrados."
  }

  assert {
    condition     = length(aws_cognito_user_pool_domain.hosted_ui) == 0
    error_message = "Floci no debe intentar crear el dominio Hosted UI no soportado."
  }
}
