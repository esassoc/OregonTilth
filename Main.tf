variable "keyVaultName" {
  type = string
}

variable "storageAccountName" {
  type = string
}

variable "resourceGroupName" {
  type = string
}

variable "sqlUsername" {
  type = string
}

variable "sqlPassword" {
  type = string
}

variable "databaseName" {
  type = string
}

variable "dbServerName" {
  type = string
}

variable "databaseEdition" {
  type = string
}

variable "databaseTier" {
  type = string
}

variable "aspNetEnvironment" {
  type = string
}

variable "azureClusterResourceGroup" {
  type = string
}

variable "databaseResourceGroup" {
  type = string
}

variable "sqlApiUsername" {
  type = string
}

variable "projectNumber" {
  type = string
}

variable "team" {
  type = string
}

variable "datadogApiKey" {
  type = string
  sensitive = true
}

variable "datadogAppKey" {
  type = string
  sensitive = true
}

variable "domainWeb" {
  type = string
}

variable "elasticPoolName" {
  type = string
}


// this variable is used for the keepers for the random resources https://registry.terraform.io/providers/hashicorp/random/latest/docs
variable "amd_id" {
  type = string
  sensitive = false
  default = "1"
}

terraform {
  required_version   = ">= 0.11"
  backend "azurerm" {
    container_name          = "terraform"
    key                     = "terraform.tfstate"
  } 
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=3.91.0"
    }
    random = {
      source = "hashicorp/random"
      version = "~> 3.2.0"
    }
	 datadog = {
      source = "DataDog/datadog"
    }
  }
}

# Configure the Azure Provider
provider "azurerm" {
  features {}
}

# Configure the Datadog provider
provider "datadog" {
  api_key = var.datadogApiKey
  app_key = var.datadogAppKey
}


data "azurerm_client_config" "current" {}


locals {
  tags = {
    "managed"     = "terraformed"
    "environment" = var.aspNetEnvironment
    "team" = var.team
    "projectNumber" = var.projectNumber
  }
  dataDogTeam = "@team-${var.team}%{ if var.aspNetEnvironment == "Staging"}-qa%{ endif }"
}


resource "azurerm_resource_group" "web" {
  name                         = var.resourceGroupName
  location                     = "West US"
  tags                         = local.tags
}


#blob storage
resource "azurerm_storage_account" "web" {
  name                         = var.storageAccountName
  resource_group_name          = azurerm_resource_group.web.name
  location                     = azurerm_resource_group.web.location
  account_replication_type     = "GRS"
  account_tier                 = "Standard"
  tags                         = local.tags
}

resource "datadog_synthetics_test" "api_test" {
  type    = "api"
  subtype = "http"
  request_definition {
    method = "GET"
    url    = "https://${var.domainWeb}/api/healthz"
  }
  request_headers = {
    Content-Type   = "application/json"
  }
  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }
  locations = ["aws:us-west-1","aws:us-east-1"]
  options_list {
    tick_every = 900

    retry {
      count    = 2
      interval = 30000
    }

    monitor_options {
      renotify_interval = 120
    }
  }
  #email subject, attach url in place of var.domainWeb
  name    = "${var.aspNetEnvironment} - https://${var.domainWeb}/api/healthz API test"
  #email body
  message = "Notify ${local.dataDogTeam}"
  tags    = ["env:${var.aspNetEnvironment}", "managed:terraformed", "team:${var.team}"]

  status = "live"
}

resource "datadog_synthetics_test" "web_test" {
  type    = "api"
  subtype = "http"
  request_definition {
    method = "GET"
    url    = "https://${var.domainWeb}"
  }
  request_headers = {
    Content-Type   = "application/json"
  }
  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }
  locations = ["aws:us-west-1","aws:us-east-1"]
  options_list {
    tick_every = 900

    retry {
      count    = 2
      interval = 30000
    }

    monitor_options {
      renotify_interval = 120
    }
  }
  #email subject, attach url in place of var.domainWeb
  name    = "${var.aspNetEnvironment} - https://${var.domainWeb} Web test"
  #email body
  message = "Notify ${local.dataDogTeam}"
  tags    = ["env:${var.aspNetEnvironment}", "managed:terraformed", "team:${var.team}"]

  status = "live"
}
# outputs like this will be set as pipeline variables
# in this case the pipeline will have access to "$(TF_OUT_APPLICATiON_STORAGE_ACCOUNT_KEY)"
# to make this happen, you can do this with your pipeline:
# - task: TerraformCLI@0
#   displayName: 'terraform output'
#   inputs:
#     command: output
output "application_storage_account_key" {
  sensitive = true
  value = azurerm_storage_account.web.primary_access_key
}

output "application_storage_account_connection_string" {
  sensitive = true
  value = azurerm_storage_account.web.primary_connection_string
}

# can be used in pipeline like $(TF_OUT_STORAGE_ACCOUNT_SAS_KEY)
# output "storage_account_sas_key" {
#   sensitive = true
#   value = data.azurerm_storage_account_sas.web.sas
# }

#sql
data "azurerm_mssql_server" "spoke" {
  name                = var.dbServerName
  resource_group_name = var.databaseResourceGroup
}

data "azurerm_mssql_elasticpool" "spoke" {
  name                = var.elasticPoolName
  resource_group_name = var.databaseResourceGroup
  server_name         = var.dbServerName
}

resource "azurerm_mssql_database" "database" {
  name            = var.databaseName
  server_id       = data.azurerm_mssql_server.spoke.id
  collation       = "SQL_Latin1_General_CP1_CI_AS"
  license_type    = "LicenseIncluded"
  max_size_gb     = 2
  read_scale      = false
  sku_name        = var.databaseTier
  zone_redundant  = false
  elastic_pool_id = data.azurerm_mssql_elasticpool.spoke.id
  enclave_type = "VBS"
  
  long_term_retention_policy {
    weekly_retention  = "P3M"
    monthly_retention = "P1Y"
    yearly_retention  = "P3Y"
    week_of_year      = 7
  }

  short_term_retention_policy {
    retention_days = 30
  }

  tags            = local.tags
}

output "database_id" {
  value = azurerm_mssql_database.database.id
}

### BEGIN API Sql user/login ###
resource "random_password" "sqlApiPassword" {
  length           = 16
  special          = true
  override_special = "!+-"
  min_lower        = 3
  min_upper        = 3
  min_special      = 3
  min_numeric      = 3
  keepers = {
    amd_id = var.amd_id
  }
}

output "sql_api_password" {
  sensitive = true
  value = random_password.sqlApiPassword.result
  depends_on = [
    random_password.sqlApiPassword
  ]
}
### END API Sql user/login ###

#key vault was created prior to terraform run
resource "azurerm_key_vault" "web" {
  name                         = var.keyVaultName
  location                     = azurerm_resource_group.web.location
 
  resource_group_name          = azurerm_resource_group.web.name
  soft_delete_retention_days   = 7
  purge_protection_enabled     = false
  tenant_id                    = data.azurerm_client_config.current.tenant_id
  tags                         = local.tags

  sku_name = "standard"
}

resource "azurerm_key_vault_access_policy" "thisPipeline" {
  key_vault_id = azurerm_key_vault.web.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  key_permissions = [
    "Backup", "Create", "Decrypt", "Delete", "Encrypt", "Get", "Import", "List", "Purge", "Recover", "Restore", "Sign", "UnwrapKey", "Update", "Verify", "WrapKey"
  ]

  secret_permissions = [
    "Backup", "Delete", "Get", "List", "Purge", "Recover", "Restore", "Set"
  ]

  storage_permissions = [
    "Backup", "Delete", "DeleteSAS", "Get", "GetSAS", "List", "ListSAS", "Recover", "RegenerateKey", "Restore", "Set", "SetSAS", "Update"
  ]
}

resource "azurerm_key_vault_secret" "sqlAdminPass" {
  name                         = "sqlAdministratorPassword"
  value                        = var.sqlPassword
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    azurerm_key_vault_access_policy.thisPipeline
  ]
}
 
resource "azurerm_key_vault_secret" "sqlAdminUser" {
  name                         = "sqlAdministratorUsername"
  value                        = var.sqlUsername
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    azurerm_key_vault_access_policy.thisPipeline
  ]
}
  



 resource "azurerm_key_vault_secret" "sqlApiUsername" {
  name                         = "sqlApiUsername"
  value                        = var.sqlApiUsername
  key_vault_id                 = azurerm_key_vault.web.id
 
  tags                         = local.tags
  depends_on = [
    azurerm_key_vault_access_policy.thisPipeline
  ]
 }

resource "azurerm_key_vault_secret" "sqlApiPassword" {
  name                         = "sqlApiPassword"
  value                        = random_password.sqlApiPassword.result
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    azurerm_key_vault_access_policy.thisPipeline
  ]
}

resource "azurerm_key_vault_secret" "sqlApiConnectionString" {
  name                         = "sqlApiConnectionString"
  value                        = "Data Source=tcp:${data.azurerm_mssql_server.spoke.fully_qualified_domain_name},1433;Initial Catalog=${var.databaseName};Persist Security Info=True;User ID=${var.sqlApiUsername};Password=${random_password.sqlApiPassword.result}"
  key_vault_id                 = azurerm_key_vault.web.id

  tags                         = local.tags
  depends_on = [
    azurerm_key_vault_access_policy.thisPipeline
  ]
}

resource "azurerm_key_vault_secret" "blobConnectionString" {
  name                         = "blobConnectionString"
  value                        = azurerm_storage_account.web.primary_connection_string
  key_vault_id                 = azurerm_key_vault.web.id
  
  tags                         = local.tags
  depends_on = [
    azurerm_key_vault_access_policy.thisPipeline
  ]
}