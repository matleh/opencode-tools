export const NotificationPlugin = async ({ project, client, $, directory, worktree }) => {
  const notify = async (message, sound = 'default') => {
    const dirname = directory.split('/').filter(Boolean).pop() || 'root'
    
    // Fetch VCS info to get current branch
    let branch = 'no branch'
    try {
      const vcsInfo = await client.vcs.get()
      branch = vcsInfo.data?.branch || 'no branch'
    } catch (error) {
      // Ignore errors and use default
    }
    
    const title = `opencode - ${dirname} (${branch})`
    await $`osascript -e 'display notification "${message}" with title "${title}" sound name "${sound}"'`
  }

  return {
    event: async ({ event }) => {
      // Send notification on session completion (main sessions only)
      if (event.type === "session.idle") {
        try {
          const sessionResult = await client.session.get({ 
            path: { id: event.properties.sessionID } 
          })
          // Only notify for main sessions (no parentID means not a sub-agent)
          if (sessionResult.data && !sessionResult.data.parentID) {
            await notify("Session completed!", "Hero")
          }
        } catch (error) {
          // If we can't fetch session info, notify anyway (fail open)
          await notify("Session completed!", "Hero")
        }
      }

      // Send notification when permission is requested
      if (event.type === "permission.updated") {
        await notify("Permission required!", "Glass")
      }
    },
  }
}
