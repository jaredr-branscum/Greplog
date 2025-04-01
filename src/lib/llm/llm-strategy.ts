export interface LLMStrategy {
    generateResponse(prompt: string): Promise<string>
}
