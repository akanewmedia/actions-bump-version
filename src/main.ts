import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const workspace = process.env.GITHUB_WORKSPACE ?? './'
    core.info(`workspace directory: ${workspace}`)

    if (github.context.eventName === 'push') {
      const pushPayload = github.context.payload
      core.info(`The head commit is: ${pushPayload.head_commit}`)
    }
    const myToken = core.getInput('token')
    core.info(`myToken: ${myToken}`)
    const octokit = github.getOctokit(myToken)

    const messages = await octokit.rest.repos.listCommits()
    const commitMessages = messages.data.map(
      ({ commit }) => `${commit.message}`
    )

    core.info(commitMessages.join('\n'))
    // const commitMessage = 'version bump to'
    // const isVersionBump = messages
    //   .map((message: string) => message.toLowerCase().includes(commitMessage))
    //   .includes(true)

    // if (isVersionBump) {
    //   core.setFailed('No action necessary!')
    //   return
    // }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    core.setFailed(error)
  }
}

run()
