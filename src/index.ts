#!/usr/bin/env node

import { GenerateOptions } from './types/generate-options'
import { PublishOptions } from './types/publish-options'
import { getGitContent } from './lib/git'
import { generateMarkdownContent, writeChangelogFiles, generateIndexHtml } from './lib/markdown'
import { deployChangeLog } from './lib/publish'
const { Command } = require('commander')
import path from 'path'

const program = new Command()
program.name('greplog').version('1.0.0').description('CLI tool for managing your CHANGELOG')

program
    .command('generate')
    .description('Generate a markdown & html file entry in your changelog')
    .option('-v, --version <version>', 'Specify the semantic version of the new CHANGELOG entry (e.g., 1.2.3)', '1.0.0') // Nice-to-have: infer semantic version from git tags
    .option('-f, --from <commit>', 'Start of commit range (e.g., tag1, commit-hash)', 'HEAD~1') // Default last commit.
    .option('-t, --to <commit>', 'End of commit range (e.g., tag2, commit-hash)', 'HEAD') // Default to HEAD.
    .option(
        '-o, --output <path>',
        'Directory path to place the generated changelog markdown file (e.g., changelog.md)',
        'changelog',
    )
    .action(async (options: GenerateOptions) => {
        const version = options.version
        const outputDir = path.join(process.cwd(), options.output)
        const markdownOutput = path.join(process.cwd(), options.output, `changelog-${version}.md`)
        const htmlOutput = path.join(process.cwd(), 'dist', `changelog-${version}.html`)
        const gitCommits = await getGitContent(options)
        const markdownContent = await generateMarkdownContent(version, gitCommits)
        await writeChangelogFiles(outputDir, markdownOutput, htmlOutput, markdownContent)
        generateIndexHtml('dist')
    })

program
    .command('publish')
    .description('Deploy the new changelog entry to GitHub Pages')
    .option('-b, --branch <branch>', 'The branch to deploy to on Github pages', 'gh-pages')
    .action(async (options: PublishOptions) => {
        try {
            const distPath = path.join(process.cwd(), 'dist')
            await deployChangeLog(distPath, options.branch)
            console.log(`Published changelog to GitHub Pages`)
        } catch (error) {
            console.error('Error publishing changelog:', (error as Error).message)
        }
    })

program.parse(process.argv)

console.log('Thank you for using Greplog')
