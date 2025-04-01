// openai-strategy.ts
import { OpenAI } from 'openai'
import { LLMStrategy } from './llm-strategy'

export class OpenAIStrategy implements LLMStrategy {
    async generateResponse(prompt: string): Promise<string> {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const response = await client.responses.create({
            model: process.env.LLM_TYPE || 'gpt-4o',
            instructions: `You are an expert specialized in generating professional accurate changelogs in markdown format.
           Do not hallucinate, assume, or invent any information. Assume that there exists a header that will be displayed
           above your response to show the changelog entry version.`,
            input: prompt,
        })

        if (response.output_text) {
            return response.output_text
        } else {
            throw new Error('No markdown response from OpenAI') // TODO: create custom exception
        }
    }
}
