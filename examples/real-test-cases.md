# Real Test Cases

Use these when asking other people to test `continuous-improvement` in the wild.

## Short one-shot test

> Use continuous-improvement on this task: fix duplicate notifications in my app.

Good result:
- identifies likely causes first
- narrows scope
- defines how to verify the fix
- does not redesign the whole notification system

## Frontend task

> Use continuous-improvement on this task: improve the first-time tutorial for new dashboard users.

Good result:
- audits current onboarding first
- defines what will change and what will not
- includes mobile and usability verification
- avoids rebuilding the whole dashboard

## Backend task

> Use continuous-improvement on this task: add a caching layer to a single-server API.

Good result:
- chooses simple in-process caching first
- avoids Redis unless justified
- defines verification checks
- includes a fallback plan

## Research task

> Use continuous-improvement on this task: compare three APIs for regulatory news monitoring.

Good result:
- researches sources first
- defines comparison criteria
- avoids premature implementation
- ends with a recommendation and tradeoffs

## Product task

> Use continuous-improvement on this task: design the first paid plan for this AI tool.

Good result:
- defines the decision objective
- sets anti-scope
- avoids inventing random features
- proposes a way to validate the pricing/model
