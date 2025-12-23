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
      const result = await $`beans prime`.quiet()
      beansInstructions = result.stdout
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
