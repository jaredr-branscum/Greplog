import { LLMStrategy } from './llm-strategy'
import { OllamaStrategy } from './ollama-strategy'
import { OpenAIStrategy } from './openai-strategy'

export class LLMContext {
    private strategy: LLMStrategy

    constructor(llmType: string = process.env.LLM_TYPE || 'ollama') {
        if (llmType.toLowerCase() === 'openai') {
            this.strategy = new OpenAIStrategy()
        } else {
            // ollama default strategy
            this.strategy = new OllamaStrategy()
        }
    }

    async generateResponse(prompt: string): Promise<string> {
        return this.strategy.generateResponse(prompt)
    }
}
