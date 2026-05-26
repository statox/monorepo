# Monorepo usage

- Each change in a backend route (added/removed/schema updated/auth updated) must trigger an SDK generation
- Unless explicitely asked never run `git commit` yourself, always give the user the command to run and wait for them to allow you to continue
    - At the begining of the work session ask the user what they prefer for this session


# superpower plugin config

## No sub agent
When using the `writing-plans` skill always replace this:

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

With

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

## No automatic finishing-a-development-branch skill

After running a skill executing a plan do not immediately run the superpowers:finishing-a-development-branch skill. Instead ask the user if they want you to do it.

// Comment - agent ignore this: I want to rename superpowers/ docs/ and there is a plugin Github issue stating that the plugin can be configured from here so I'll do that soon.
