// ollama-strategy.ts
import fetch from 'node-fetch'
import { LLMStrategy } from './llm-strategy'

export class OllamaStrategy implements LLMStrategy {
    async generateResponse(prompt: string): Promise<string> {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate'
        const modelName = process.env.MODEL || 'gemma3:1b'

        const response = await fetch(ollamaUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelName,
                prompt: `You are an expert specialized in generating professional accurate changelogs in markdown format.
                Assume that there exists a header that will be displayed above your response to show the changelog entry version. Here is the prompt: ${prompt}
                        \n Your response should only contain the professional changelog.`,
                stream: false,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        if (data.response) {
            return data.response
        } else {
            throw new Error('No markdown response from Ollama') // TODO: create custom exception
        }
    }
}
