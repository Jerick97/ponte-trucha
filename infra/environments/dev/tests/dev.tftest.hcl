mock_provider "aws" {}

run "omits_cost_controls_for_floci" {
  command = plan

  assert {
    condition     = length(aws_budgets_budget.monthly_cost) == 0
    error_message = "Floci no implementa AWS Budgets y no debe intentar crearlos."
  }
}

run "creates_budget_controls_in_aws" {
  command = plan

  variables {
    budget_alert_emails   = ["infra-alerts@example.com"]
    use_floci             = false
    web_adapter_layer_arn = "arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerArm64:25"
  }

  assert {
    condition     = length(aws_budgets_budget.monthly_cost) == 1
    error_message = "AWS real debe crear un presupuesto mensual con alertas."
  }
}

run "wires_the_local_jwt_bridge_only_with_floci" {
  command = plan

  assert {
    condition     = module.api.local_jwt_bridge_enabled
    error_message = "Con Floci, las Lambdas deben verificar el token del User Pool emulado."
  }
}

run "keeps_the_local_jwt_bridge_out_of_aws" {
  command = plan

  variables {
    budget_alert_emails   = ["infra-alerts@example.com"]
    use_floci             = false
    web_adapter_layer_arn = "arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerArm64:25"
  }

  assert {
    condition     = !module.api.local_jwt_bridge_enabled
    error_message = "En AWS real los claims y scopes vienen del JWT authorizer, no de la Lambda."
  }
}
