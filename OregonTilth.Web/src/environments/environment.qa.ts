// All environment values are supplied at runtime from GET /assets/config.json (see
// DynamicEnvironment and OregonTilth.Web/Startup.cs); this file exists only so the QA build has a
// file-replacement target.
import { DynamicEnvironment } from './dynamic-environment';
class Environment extends DynamicEnvironment {

  constructor() {
    super(false);
  }
}

export const environment = new Environment();
