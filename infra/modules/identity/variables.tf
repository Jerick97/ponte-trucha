variable "callback_urls" {
  description = "URLs OAuth permitidas para la SPA adulta."
  type        = list(string)

  validation {
    condition     = length(var.callback_urls) > 0 && alltrue([for url in var.callback_urls : can(regex("^https?://", url))])
    error_message = "callback_urls debe contener al menos una URL HTTP(S)."
  }
}

variable "cognito_domain_prefix" {
  default     = null
  description = "Prefijo opcional del dominio Hosted UI; se omite en tests aislados."
  type        = string
  nullable    = true
}

variable "cost_center" {
  description = "Centro de costo que identifica el entorno."
  type        = string
}

variable "enable_hosted_ui_domain" {
  default     = true
  description = "Crea el dominio Hosted UI cuando el proveedor lo soporta."
  type        = bool
}

variable "environment" {
  description = "Ambiente aislado de la infraestructura."
  type        = string
}

variable "issuer_base_url_override" {
  default     = null
  description = <<-EOT
    Base del issuer cuando el proveedor no es AWS real. El emulador local firma
    los tokens con su propio host (por ejemplo `http://localhost:4566`), así que
    el JWT authorizer necesita ese valor exacto para validarlos. En AWS se deja
    en null y el issuer se deriva del endpoint del User Pool.
  EOT
  type        = string
  nullable    = true

  validation {
    condition     = var.issuer_base_url_override == null || can(regex("^https?://[^/]+$", var.issuer_base_url_override))
    error_message = "issuer_base_url_override debe ser una URL HTTP(S) sin path final."
  }
}

variable "owner" {
  description = "Responsable operativo de los recursos."
  type        = string
}

variable "project" {
  description = "Identificador estable del proyecto."
  type        = string
}
