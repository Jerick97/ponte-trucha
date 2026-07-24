variable "cost_center" {
  description = "Centro de costo que identifica el entorno."
  type        = string
}

variable "domain_read_capacity" {
  default     = 5
  description = "RCU provisionadas para la tabla de dominio."
  type        = number
}

variable "domain_write_capacity" {
  default     = 5
  description = "WCU provisionadas para la tabla de dominio."
  type        = number
}

variable "enable_pitr" {
  default     = false
  description = "Activa recuperación a un punto en el tiempo cuando el ambiente lo aprueba."
  type        = bool
}

variable "environment" {
  description = "Ambiente aislado de la infraestructura."
  type        = string
}

variable "idempotency_read_capacity" {
  default     = 2
  description = "RCU provisionadas para la tabla de idempotencia."
  type        = number
}

variable "idempotency_write_capacity" {
  default     = 2
  description = "WCU provisionadas para la tabla de idempotencia."
  type        = number
}

variable "owner" {
  description = "Responsable operativo de los recursos."
  type        = string
}

variable "project" {
  description = "Identificador estable del proyecto."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project))
    error_message = "project solo puede incluir minúsculas, números y guiones."
  }
}
