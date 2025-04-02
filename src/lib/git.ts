import simpleGit, { SimpleGit, DefaultLogFields, ListLogLine, LogOptions } from 'simple-git'
import { GenerateOptions } from '@/types/generate-options'
import path from 'path'
import { marked } from 'marked'
import fs from 'fs'
import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Using 'any' as simple-git's log output types are incomplete. (technical debt)
export async function getGitContent(options: GenerateOptions): Promise<any> {
    const git: SimpleGit = simpleGit()
    let from = options.from
    const to = options.to
    try {
        await validateGitRepo(git)
        const log = await getGitCommits(git, to, from)
        return log.all
    } catch (error) {
        console.error('Failed to get contents from git repository: ', (error as Error).message)
    }
}

/**
 * Ensure directory is a valid git repo and contains commits to produce a changelog entry
 */
async function validateGitRepo(git: SimpleGit) {
    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
        throw new Error('The current directory is not a git repository.') // TODO: create custom exception
    }
    const hasCommits = await git.revparse(['--verify', 'HEAD']).catch(() => false)
    if (!hasCommits) {
        throw new Error('No commits found in the repository. Initial commit is required.') // TODO: create custom exception
    }
}

// If from flag is empty, then fetch all contents from active branch
function buildGitLogConfig(to: string, from: string) {
    let gitLogConfig: LogOptions<string> = { format: '%s' }
    if (from) {
        gitLogConfig = { ...gitLogConfig, from, to }
    }

    return gitLogConfig
}

/**
 * Ensure directory is a valid git repo and contains commits to produce a changelog entry
 * Using 'any' as simple-git's log output types are incomplete. (technical debt)
 */
async function getGitCommits(git: SimpleGit, to: string, from: string) {
    const gitConfig = buildGitLogConfig(to, from)
    const log: any = await git.log(gitConfig)
    if (log.all.length === 0) {
        throw new Error('There are no changes available to create new changelog') // TODO: create custom exception
    }
    return log
}
