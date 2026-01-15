const appendix = `
Appendix: Modifying Bean Body Content
IMPORTANT: Never directly edit bean files in .beans/ or wherever beans are stored. The location is configurable and may be outside the repository. Always use the beans CLI.
Modifying Bean Bodies
Use the temp file workflow to update bean body content (checklists, descriptions, notes):
# 1. Read bean body to temp file
beans show <id> --body-only > /tmp/bean-<id>.md
# 2. Modify the temp file (e.g., check off checklist items)
#    Use Read/Edit/Write tools to modify /tmp/bean-<id>.md
# 3. Update the bean
beans update <id> --body-file /tmp/bean-<id>.md
# 4. Clean up
rm /tmp/bean-<id>.md
For metadata changes (status, priority, title, type, tags, relationships), use CLI flags directly:
beans update <id> --status completed
beans update <id> --priority high
beans update <id> --title "New title"
Concurrency: Only one agent should modify a given bean at a time. Multiple agents can safely modify different beans concurrently.
`;


export const BeansPlugin = async ({ $, directory }) => {
  // Check if beans CLI exists and project has beans config
  let beansInstructions = ""

  try {
    // Both conditions must be true:
    // 1. beans CLI is installed
    // 2. Project has .beans.yml config
    const hasBeans = await $`which beans`.quiet()
    const hasConfig = await $`test -f ${directory}/.beans.yml`.quiet()

    if (hasBeans.exitCode === 0 && hasConfig.exitCode === 0) {
      const result = await $`beans prime`.cwd(directory).quiet()
      beansInstructions = result.stdout.toString()
      beansInstructions = `${beansInstructions}\n\n${appendix}`;
    }
  } catch (e) {
    // beans not available or not configured - silently skip
  }

  return {
    // Inject into system prompt for every message
    "experimental.chat.system.transform": async (input, output) => {
      if (beansInstructions) {
        output.system.push(beansInstructions)
      }
    },

    // Re-inject after compaction to ensure persistence
    "experimental.session.compacting": async (input, output) => {
      if (beansInstructions) {
        output.context.push(beansInstructions)
      }
    },
  }
}
