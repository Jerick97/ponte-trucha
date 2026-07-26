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

run "derives_the_aws_issuer_when_there_is_no_override" {
  command = plan

  assert {
    condition     = startswith(output.issuer, "https://")
    error_message = "En AWS real el issuer debe ser HTTPS y derivarse del endpoint del pool."
  }

  assert {
    condition     = length(output.scope_names) == 6
    error_message = "El módulo debe publicar los seis scopes para el puente y las rutas."
  }
}

run "uses_the_emulator_issuer_when_overridden" {
  command = plan

  variables {
    issuer_base_url_override = "http://localhost:4566"
  }

  assert {
    condition     = startswith(output.issuer, "http://localhost:4566/")
    error_message = "Con override, el issuer debe apuntar al host del emulador."
  }
}

run "rejects_an_override_with_path" {
  command = plan

  variables {
    issuer_base_url_override = "http://localhost:4566/us-east-1_algo"
  }

  expect_failures = [var.issuer_base_url_override]
}
