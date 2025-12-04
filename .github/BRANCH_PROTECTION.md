# Branch Protection Settings

This document describes the recommended branch protection settings for this repository.

## Main Branch Protection

Configure the following settings in GitHub repository settings:

1. **Require pull request reviews before merging**
   - Required approvals: 1
   - Dismiss stale reviews: Yes
   - Require review from code owners: No

2. **Require status checks to pass before merging**
   - Require branches to be up to date: Yes
   - Required status checks:
     - `test` (from CI workflow)
     - `lint` (if separate workflow)

3. **Require conversation resolution before merging**: Yes

4. **Do not allow bypassing the above settings**: Yes (for administrators too)

5. **Allow force pushes**: No

6. **Allow deletions**: No

## Fork Policy

- **Allow forks**: Yes
- Contributors should fork the repository and submit pull requests from their forks
- All pull requests from forks will be subject to the same review process

## License

All contributions are licensed under MIT License as specified in LICENSE file.

