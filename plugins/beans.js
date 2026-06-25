export const BeansPlugin = async ({ $, directory }) => {
  // Check if beans CLI exists and project has beans config
  // Primer lives next to this plugin file
  const primerPath = new URL("beans-primer.md", import.meta.url).pathname
  let beansInstructions = ""

  const loadInstructions = async () => {
    try {
      // Both conditions must be true:
      // 1. beans CLI is installed
      // 2. Project has .beans.yml config
      const hasBeans = await $`which beans`.quiet()
      const hasConfig = await $`test -f ${directory}/.beans.yml`.quiet()

      if (hasBeans.exitCode === 0 && hasConfig.exitCode === 0) {
        const result = await $`cat ${primerPath}`.quiet()
        return result.stdout.toString()
      }
    } catch (e) {
      // beans not available or not configured - silently skip
    }
    return ""
  }

  beansInstructions = await loadInstructions()

  return {
    // Inject into system prompt for every message (re-read each time to stay fresh)
    "experimental.chat.system.transform": async (input, output) => {
      beansInstructions = await loadInstructions()
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
