import ghpages from 'gh-pages'
import fs from 'fs'
import path from 'path'

export async function deployChangeLog(path: string, branch: string) {
    const needsCleanup = initializeNodeEnvironment()
    console.log(`Deploying Changelog to branch ${branch}`)
    await ghpages.publish(path, { branch: branch, dotfiles: false, src: '*.html' }, githubPagesCallback)
    cleanupNodeEnvironment(needsCleanup)
}

function githubPagesCallback(err: Error | null) {
    if (err) {
        console.error('Deployment failed: ', err)
    } else {
        console.log('Github pages deployment successful')
    }
}

interface NodeEnv {
    packageJsonCreated: boolean
    nodeModulesExisted: boolean
}

// Creates empty package.json if one does not exist to create Node environment for publishing to Github Pages
// Returns true if package.json file had to be created. Else returns false
function initializeNodeEnvironment(): NodeEnv {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const nodeModulesPath = path.join(process.cwd(), 'node_modules')
    const nodeModulesExisted = fs.existsSync(nodeModulesPath)
    let packageJsonCreated = false

    if (!fs.existsSync(packageJsonPath)) {
        try {
            fs.writeFileSync(packageJsonPath, '{}') // Create an empty JSON object
            console.log('Created an empty package.json file.')
            packageJsonCreated = true
        } catch (error) {
            console.error('Error creating package.json:', error)
            process.exit(1) // Exit with an error code
        }
    }
    return { packageJsonCreated, nodeModulesExisted }
}

function cleanupNodeEnvironment(nodeEnv: NodeEnv) {
    if (nodeEnv.packageJsonCreated) {
        const packageJsonPath = path.join(process.cwd(), 'package.json')
        if (fs.existsSync(packageJsonPath)) {
            try {
                fs.unlinkSync(packageJsonPath)
                console.log('Removed package.json file.')
            } catch (error) {
                console.error('Error removing package.json:', error)
            }
        }
    }

    if (!nodeEnv.nodeModulesExisted) {
        const nodeModulesPath = path.join(process.cwd(), 'node_modules')
        if (fs.existsSync(nodeModulesPath)) {
            try {
                fs.rmSync(nodeModulesPath, { recursive: true, force: true })
                console.log('Removed node_modules folder.')
            } catch (error) {
                console.error('Error removing node_modules:', error)
            }
        }
    }
}
