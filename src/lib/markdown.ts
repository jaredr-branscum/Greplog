import path from 'path'
import { marked } from 'marked'
import fs from 'fs'
import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import * as dotenv from 'dotenv'
import { LLMContext } from './llm/llm-context'

export async function generateMarkdownContent(version: string, commits: any[]): Promise<string> {
    const commitMessages: string = commits
        .map((commit) => `- ${commit.message} (${commit.hash}) - ${new Date(commit.date).toLocaleDateString()}`)
        .join('\n')

    const prompt = getLLMPrompt(version, commitMessages)
    const llmContext = new LLMContext()

    try {
        const llmResponse = await llmContext.generateResponse(prompt)
        return `# Important Updates in ${version}\n\n${llmResponse}`
    } catch (error) {
        console.error('Error generating changelog from the LLM:', error)
        throw new Error('LLM Exception') // TODO: create custom exception
    }
}

export async function writeChangelogFiles(
    outputDir: string,
    markdownOutput: string,
    htmlOutput: string,
    markdownContent: string,
): Promise<void> {
    createDirectoryIfNotExists(outputDir)
    createDirectoryIfNotExists(path.dirname(htmlOutput))
    fs.writeFileSync(markdownOutput, markdownContent)
    const cleanHtml = await convertMarkdownToHtml(markdownContent)
    fs.writeFileSync(htmlOutput, cleanHtml)
}

function createDirectoryIfNotExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }
}

async function convertMarkdownToHtml(markdownContent: string): Promise<string> {
    const html = await marked.parse(markdownContent)
    const { window } = new JSDOM('')
    const DOMPurify = createDOMPurify(window)
    return DOMPurify.sanitize(html)
}

export async function generateIndexHtml(distPath: string): Promise<void> {
    console.log(`Looking for changelog files in: ${distPath}`)

    const allFiles = fs.readdirSync(distPath)
    console.log('All files in directory:', allFiles)

    const changelogFiles = allFiles
        .filter((file) => file.match(/^changelog-\d+\.\d+\.\d+\.html$/))
        .sort((a, b) => compareVersionsDescending(a, b))

    console.log('Filtered changelog files:', changelogFiles)

    let changelogOptions = new Set<string>()
    let changelogContents = ''

    for (const file of changelogFiles) {
        const version = file.replace('changelog-', '').replace('.html', '')
        const majorVersion = version.split('.')[0] + '.x'

        changelogOptions.add(majorVersion)

        const filePath = path.join(distPath, file)
        console.log(`Processing file: ${filePath}`)

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`)
            continue
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const bodyContent = extractBodyContent(fileContent)

        changelogContents += `
            <details class="changelog-entry" data-major-version="${majorVersion}">
                <summary><strong>${version}</strong></summary>
                <div>${bodyContent}</div>
            </details>\n`
    }

    const dropdownOptions = Array.from(changelogOptions)
        .sort()
        .map((version) => `<option value="${version}">${version}</option>`)
        .join('')

    const indexHtml = `<!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Changelog</title>
        <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { text-align: center; }
        label { font-weight: bold; }
        select { padding: 5px; margin-left: 10px; }
        details { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .changelog-entry { display: block; }
        </style>
        </head>
        <body>
            <h1>Changelog</h1>
            <label for="versionFilter">Filter by major version:</label>
            <select id="versionFilter">
                <option value="all">All Versions</option>
                ${dropdownOptions}
            </select>

            <main>${changelogContents}</main>

        <script>
            document.getElementById("versionFilter").addEventListener("change", function() {
                const selectedVersion = this.value;
                document.querySelectorAll(".changelog-entry").forEach(entry => {
                    entry.style.display = (selectedVersion === "all" || entry.dataset.majorVersion === selectedVersion) ? "block" : "none";
                });
            });
        </script>
    </body>
    </html>`

    fs.writeFileSync(path.join(distPath, 'index.html'), indexHtml)
    console.log('Generated index.html')
}

/**
 * Extracts content inside <body> tags from an HTML string.
 */
function extractBodyContent(html: string): string {
    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    return match ? match[1].trim() : html
}

/**
 * Compares two versioned filenames numerically (descending order).
 */
function compareVersionsDescending(a: string, b: string): number {
    const versionA = a
        .match(/(\d+)\.(\d+)\.(\d+)/)
        ?.slice(1)
        .map(Number) || [0, 0, 0]
    const versionB = b
        .match(/(\d+)\.(\d+)\.(\d+)/)
        ?.slice(1)
        .map(Number) || [0, 0, 0]

    for (let i = 0; i < 3; i++) {
        if (versionA[i] !== versionB[i]) {
            return versionB[i] - versionA[i] // Descending order
        }
    }
    return 0
}

function getLLMPrompt(version: string, commitMessages: string) {
    return `Generate a human-readable professional markdown changelog for version ${version} based on the following git commit messages:
       ${commitMessages}

       Possible sections to include:
       - Added: New features
       - Changed: Changes in existing functionality
       - Deprecated: Soon-to-be removed features
       - Removed: Now removed features
       - Fixed: Bug fixes
       - Security: Vulnerabilities

       Format the markdown changelog with proper headings and lists.
       Highlight key changes that impact end users and focus on impact.
       Do not hallucinate, assume, or invent any information.
       `
}
