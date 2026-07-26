variable "aws_region" {
  default     = "us-east-1"
  description = "Región del ambiente de desarrollo."
  type        = string
}

variable "callback_urls" {
  default     = ["http://localhost:5173/auth/callback"]
  description = "URLs OAuth del frontend de desarrollo."
  type        = list(string)
}

variable "cognito_domain_prefix" {
  default     = "ponte-trucha-dev"
  description = "Prefijo del dominio Hosted UI de desarrollo."
  type        = string
}

variable "cors_allowed_origins" {
  default     = ["http://localhost:5173"]
  description = "Orígenes permitidos para la SPA local."
  type        = list(string)
}

variable "cost_center" {
  default     = "hackathon"
  description = "Centro de costo para trazabilidad."
  type        = string
}

variable "owner" {
  default     = "francis"
  description = "Responsable operativo del ambiente."
  type        = string
}

variable "project" {
  default     = "ponte-trucha"
  description = "Identificador estable del proyecto."
  type        = string
}

variable "floci_issuer_base_url" {
  default     = "http://localhost:4566"
  description = "Host con el que el emulador Floci firma el `iss` de sus tokens de Cognito."
  type        = string
}

variable "use_floci" {
  default     = true
  description = "Indica que el provider se ejecuta contra Floci y no contra AWS real."
  type        = bool
}

variable "budget_alert_emails" {
  default     = []
  description = "Correos operativos adultos que reciben alertas de AWS Budgets fuera de Floci."
  type        = list(string)

  validation {
    condition     = alltrue([for email in var.budget_alert_emails : can(regex("^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$", email))])
    error_message = "budget_alert_emails debe contener correos válidos."
  }
}

variable "monthly_budget_limit_usd" {
  default     = 5
  description = "Límite mensual en USD que activa alertas en AWS real."
  type        = number

  validation {
    condition     = var.monthly_budget_limit_usd > 0
    error_message = "monthly_budget_limit_usd debe ser mayor que cero."
  }
}

variable "web_adapter_layer_arn" {
  default     = null
  description = "ARN arm64 de Lambda Web Adapter requerido para desplegar FastAPI en AWS real."
  type        = string
  nullable    = true
}
