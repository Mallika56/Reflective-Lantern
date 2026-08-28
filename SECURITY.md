# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

Report vulnerabilities by email to **chourasiamallika5@gmail.com**.

Please do **not** open a public issue for security reports.

You will receive a response within **48 hours**. If the issue is confirmed, a patch
will be released as promptly as possible and you will be credited unless you request
otherwise.

## Secret Handling

This repository must never contain credentials. `GH_PAT`, `SMTP_USER`, and `SMTP_PASS`
are injected as Cloud Routine secrets at runtime and are read from the environment only.
Any commit found to contain a live secret should be treated as a disclosure: rotate the
credential first, then rewrite history.
