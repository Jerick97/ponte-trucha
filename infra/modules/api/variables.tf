variable "api_core_code_hash" {
  description = "Hash base64 del ZIP de api-core."
  type        = string
}

variable "api_core_package_path" {
  description = "Ruta local al ZIP empaquetado de api-core."
  type        = string
}

variable "api_core_reserved_concurrency" {
  description = "Concurrencia reservada para api-core."
  type        = number

  validation {
    condition     = var.api_core_reserved_concurrency > 0
    error_message = "api_core_reserved_concurrency debe ser mayor que cero."
  }
}

variable "api_ia_code_hash" {
  description = "Hash base64 del ZIP de api-ia."
  type        = string
}

variable "api_ia_package_path" {
  description = "Ruta local al ZIP empaquetado de api-ia."
  type        = string
}

variable "api_ia_reserved_concurrency" {
  description = "Concurrencia reservada para api-ia."
  type        = number

  validation {
    condition     = var.api_ia_reserved_concurrency > 0
    error_message = "api_ia_reserved_concurrency debe ser mayor que cero."
  }
}

variable "audience" {
  description = "Client ID Cognito que acepta el JWT authorizer."
  type        = string
}

variable "cognito_issuer" {
  description = "Issuer HTTPS del User Pool de Cognito."
  type        = string
}

variable "cognito_resource_server_identifier" {
  description = "Identificador del resource server que califica los scopes OAuth de las rutas."
  type        = string
}

variable "cors_allowed_origins" {
  description = "Orígenes explícitos permitidos por CORS."
  type        = list(string)

  validation {
    condition     = length(var.cors_allowed_origins) > 0 && !contains(var.cors_allowed_origins, "*")
    error_message = "CORS requiere orígenes explícitos y no permite '*'."
  }
}

variable "cost_center" {
  description = "Centro de costo que identifica el entorno."
  type        = string
}

variable "domain_table_arn" {
  description = "ARN de la tabla de dominio a la que puede acceder api-core."
  type        = string
}

variable "domain_table_name" {
  description = "Nombre de la tabla de dominio."
  type        = string
}

variable "enable_api_stage_settings" {
  default     = true
  description = "Configura logs y límites del stage HTTP cuando el proveedor lo soporta."
  type        = bool
}

variable "enable_api_stage_tags" {
  default     = true
  description = "Etiqueta el stage HTTP cuando el proveedor implementa TagResource."
  type        = bool
}

variable "environment" {
  description = "Ambiente aislado de la infraestructura."
  type        = string
}

variable "enable_operational_alarms" {
  default     = false
  description = "Crea alarmas CloudWatch para los throttles de las Lambdas cuando AWS las soporta."
  type        = bool
}

variable "hmac_secret_arn" {
  description = "ARN del secreto HMAC que puede leer api-core."
  type        = string
}

variable "idempotency_table_arn" {
  description = "ARN de la tabla de idempotencia a la que puede acceder api-core."
  type        = string
}

variable "idempotency_table_name" {
  description = "Nombre de la tabla de idempotencia."
  type        = string
}

variable "log_retention_days" {
  default     = 14
  description = "Retención explícita de logs en CloudWatch."
  type        = number
}

variable "owner" {
  description = "Responsable operativo de los recursos."
  type        = string
}

variable "project" {
  description = "Identificador estable del proyecto."
  type        = string
}

variable "require_web_adapter_layer" {
  default     = false
  description = "Exige la layer Lambda Web Adapter cuando el entorno no es Floci."
  type        = bool
}

variable "web_adapter_layer_arn" {
  default     = null
  description = "ARN de Lambda Web Adapter para iniciar FastAPI en AWS; Floci lo omite."
  type        = string
  nullable    = true
}

variable "use_native_python_handler" {
  default     = false
  description = "Usa el puente ASGI Python solo en Floci, que no ejecuta extensiones Lambda."
  type        = bool
}
