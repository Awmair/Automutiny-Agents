# GitHub showcase standard

Verified 2026-08-30 against official GitHub documentation.

## What a credible repository should communicate quickly

1. **Visible proof:** a clear title, one-line value proposition, product screenshot or short GIF, and a live demo or demo video.
2. **Product understanding:** what the agents do, why the system matters, and where humans retain control.
3. **Reproducibility:** prerequisites, environment setup, exact run commands, and focused verification commands.
4. **Engineering evidence:** architecture, CI status, test and evaluation results, known limitations, and honest scope labels.
5. **Repository identity:** description, topics, social-preview image, license, maintainer, and a tagged demo release.
6. **Public-release safety:** no committed credentials, least-privilege workflows, immutable action references, and GitHub security features enabled.

GitHub says the README is often the first item visitors see and should explain what the project does, why it is useful, how to start, where to get help, and who maintains it: [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes).

## Current gap audit

### Critical before publishing

- Initialize the folder as a Git repository and create the GitHub repository.
- Audit the initial commit for credentials and private data. `.env.local` is ignored, but this must be verified before the first push.
- Choose and add a root `LICENSE`. Without one, default copyright applies and the project is not open source: [Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
- Rebuild the README's opening section around a real dashboard screenshot or short GIF, a concise agent/outcome table, a five-minute demo path, and complete setup requirements.
- Add a GitHub description, homepage or demo URL, and focused topics. Topics improve discovery: [Repository topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).
- Upload a GitHub social-preview image. GitHub recommends 1280 x 640 for best display and under 1 MB: [Social preview](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).
- Confirm the release-check workflow passes on GitHub and tag a first demo release.

### Security credibility

- Add private vulnerability-reporting instructions to `docs/SECURITY.md`; the current file describes boundaries but not how to report an issue.
- Add explicit read-only workflow permissions and pin external actions to full commit SHAs. GitHub identifies SHA pinning as the immutable option: [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use).
- Enable Dependabot alerts, secret scanning, push protection, and code scanning. GitHub lists these as the minimum for public repositories: [Security and analysis settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository).

### Optional for this demo

- Client packaging and one-command installation.
- Production connectors, metrics dashboards, streaming updates, and a separate live-evaluation database.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue templates, and Discussions unless outside contributions are invited.

## Recommended GitHub positioning

Present this as a **production-pattern, human-reviewed agent system**, not as a production deployment or an accuracy benchmark. Keep the existing contract, pressure, red-team, and live-schema evidence, while stating exactly what each gate proves.

Suggested topics: `ai-agents`, `agentic-workflows`, `human-in-the-loop`, `nextjs`, `typescript`, `supabase`, `groq`, `structured-outputs`, `ai-safety`, `professional-services`.
