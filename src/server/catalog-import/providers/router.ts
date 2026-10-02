import "server-only";
import type { AIProvider, AIProviderName, ProviderSelection } from "./types";

function providerName(value: string | undefined, fallback: AIProviderName): AIProviderName {
  return value === "gemini" || value === "openai" || value === "anthropic" ? value : fallback;
}

export function getProviderSelection(): ProviderSelection {
  return {
    primary: providerName(process.env.AI_PRIMARY_PROVIDER, "gemini"),
    fallback: providerName(process.env.AI_FALLBACK_PROVIDER, "openai"),
    review: providerName(process.env.AI_REVIEW_PROVIDER, "anthropic"),
  };
}

export class AIProviderRouter {
  constructor(private readonly providers: Partial<Record<AIProviderName, AIProvider>>) {}

  get(name: AIProviderName): AIProvider {
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(`El proveedor IA '${name}' no está configurado.`);
    }
    return provider;
  }

  getAvailable(selection = getProviderSelection()): AIProvider[] {
    return [selection.primary, selection.fallback, selection.review]
      .filter((name, index, names) => names.indexOf(name) === index)
      .map((name) => this.providers[name])
      .filter((provider): provider is AIProvider => provider !== undefined);
  }
}
