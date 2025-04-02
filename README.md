# Greplog: Next Generation Intelligent Changelog

You focus on creating value for your customers and we'll take care of the time-consuming task of updating your customers on the key changes made in your new releases.

## Core Features

- Developer-friendly NPM package that extracts the necessary commit history using AI to generate your changelogs.
- Very easy-to-use and install for any project regardless of release workflow (Git Flow/Trunk-based, etc.)

## Dependencies

- Permission to perform git actions to remote Github repos (recommendation: create a short-lived PAT with Contents Read/Write permission)
    - On Windows environment, I created a Generic Windows Credential to git:https://github.com for convenience
- Install Node (>=v22.14) onto your system
- Install Ollama and pull down a small model for fast testing i.e. gemma3:1b
    - Alternatively, you can use OpenAI if you have available credits :)

## AI Tools (only used free tiers)

- Gemini AI - used for bugfixing and high level feedback
- Perplexity - used for consideration of building CLI tool in Python
- ChatGPT - used to bugfix OpenAI javascript SDK & Simple-Git library implementation
- All three were broadly used when I ran into challenges testing the CLI tool locally

## Setup

1. **Install dependencies, build, then install package globally**:

    ```bash
    npm install
    npm run build
    npm install -g .
    ```

2. **Open/Switch to another Github Repository with Github Pages turned on**:
   Set your API model in your shell environment:
   No promises that the OpenAI option works, I don't have credits to verify :(
    ```bash
    MODEL=gemma3:1b or gpt-4o
    OLLAMA_URL=http://localhost:11434/api/generate
    LLM_TYPE=ollama or openai
    OPENAI_API_KEY=<OPENAI_API_KEY>
    ```
    If you're using ollama, you'll need to set your environment PATH variable to use the Ollama program. For windows,
    the executable is found at C:\Users\<account>\AppData\Local\Programs\Ollama
    Then run your ollama model with
    ```bash
    ollama run gemma3:1b
    ```
3. **Run greplog CLI commands**:

    The -h flag to show all the available commands and options

    ```bash
    greplog -h
    greplog generate -f HEAD~1 -t HEAD -v 1.0.1
    greplog publish
    ```

## Design Decisions

**Chosen Approach: CLI Tool**

- **Rationale:** Prioritizes rapid development and developer automation via CI/CD integration.
- **Pros:**
    - High customization and local environment suitability.
    - Fast iteration and user feedback.
    - Minimal infrastructure and maintenance.
- **Cons:**
    - Slightly complex CI/CD environment variable and artifact management.
    - Requires LLM API keys or local LLM setup.
    - Requires some initial setup to use the CLI tool.

**Alternative: Backend REST API**

- **Pros:**
    - Centralized control and consistency for large teams.
    - Enhanced security policies.
- **Cons:**
    - Increased development, deployment, and security complexity.
    - Higher infrastructure and maintenance costs.

**Hosting:**

- Developers typically need to host changelogs on their own infrastructure.
- We provide a simple `publish` command for GitHub Pages deployment as a proof of concept.

**Chosen Approach: Node.js CLI tool**

- **Rationale:** Easier changelog integration with static page web development
- **Pros:**
    - vast ecosystem support for CLI tasks & libraries for third-party APIs
    - better for I/O bound operations
    - cross-platform compatibility
    - Easier to build and test quickly in local environment
- **Cons:**
    - Requires some initial setup to use the CLI tool.
    - Requires building temporary Node environment for target repo

**Alternative: Python CLI tool**

- **Pros:**
    - Great for scripting and automation
    - vast ecosystem support for CLI tasks & libraries for third-party APIs
- **Cons:**
    - Slightly higher complexity building static web pages
    - Was more difficult to build & test quickly in local environment

# Future Work

- Unit tests
- More robust, human-readable exception handling
- Introduce a backend system to collect & retain context on git repository changes - maybe a vector database would give us the ability to retain information across multiple repositories, so that a breaking API change has consistent messaging across all related changelogs
- More customizable CLI flags so developers have more control of the static website building & deployment
- Better AI Prompting - I notice the results are very inconsistent and sometimes outright unreadable, so this needs some work. The current prompt still hallucinates and invents new information.
