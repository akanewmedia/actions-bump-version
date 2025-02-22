const { Toolkit } = require('actions-toolkit')
const { execSync } = require('child_process')

// Change working directory if user defined PACKAGEJSON_DIR
if (process.env.PACKAGEJSON_DIR) {
  process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env.PACKAGEJSON_DIR}`
  process.chdir(process.env.GITHUB_WORKSPACE)
}

// Run your GitHub Action!
Toolkit.run(async tools => {
  const pkg = tools.getPackageJSON()
  const event = tools.context.payload

  const messages = event.commits.map(
    commit => commit.message + '\n' + commit.body
  )

  const commitMessage = 'version bump to'
  const isVersionBump = messages
    .map(message => message.toLowerCase().includes(commitMessage))
    .includes(true)
  if (isVersionBump) {
    tools.exit.success('No action necessary!')
    return
  }

  let version
  tools.outputs.update = 'true'
  if (messages.map(message => message.includes('patch')).includes(true)) {
    version = 'patch'
  } else if (
    messages.map(message => message.includes('major')).includes(true)
  ) {
    version = 'major'
  } else if (
    messages
      .map(message => message.toLowerCase().includes('minor'))
      .includes(true)
  ) {
    version = 'minor'
  } else {
    version = 'prerelease'
    // tools.outputs.update = 'false'
    // tools.exit.success('Commits with changes version not found')
    // exit
  }

  try {
    const current = pkg.version.toString()
    // set git user
    await tools.runInWorkspace('git', [
      'config',
      'user.name',
      `"${process.env.GITHUB_USER || 'Automated Version Bump'}"`
    ])
    await tools.runInWorkspace('git', [
      'config',
      'user.email',
      `"${
        process.env.GITHUB_EMAIL ||
        'gh-action-bump-version@users.noreply.github.com'
      }"`
    ])

    const currentBranch = /refs\/[a-zA-Z]+\/(.*)/.exec(
      process.env.GITHUB_REF
    )[1]
    console.log('currentBranch:', currentBranch)

    // do it in the current checked out github branch (DETACHED HEAD)
    // important for further usage of the package.json version
    if (version === 'prerelease') {
      await tools.runInWorkspace('yarn', [
        'version',
        '--prerelease',
        '--preid rc',
        '--no-git-tag-version',
        current
      ])
      console.log('current:', current, '/', 'version:', version)
      let newVersion = execSync(
        `yarn version --prerelease --preid rc --no-git-tag-version`
      )
        .toString()
        .trim()
      await tools.runInWorkspace('git', [
        'commit',
        '-a',
        '-m',
        `ci: ${commitMessage} ${newVersion}`
      ])
    } else {
      await tools.runInWorkspace('yarn', [
        'version',
        '--no-git-tag-version',
        current
      ])
      console.log('current:', current, '/', 'version:', version)
      let newVersion = execSync(
        `yarn version --no-git-tag-version --${version}`
      )
        .toString()
        .trim()
      await tools.runInWorkspace('git', [
        'commit',
        '-a',
        '-m',
        `ci: ${commitMessage} ${newVersion}`
      ])
    }
    // now go to the actual branch to perform the same versioning
    if (version === 'prerelease') {
      await tools.runInWorkspace('git', ['checkout', currentBranch])
      await tools.runInWorkspace('yarn', [
        'version',
        '--prerelease',
        '--preid rc',
        '--no-git-tag-version',
        current
      ])
      console.log('current:', current, '/', 'version:', version)
      let newVersion = execSync(
        `yarn version --prerelease --preid rc --no-git-tag-version`
      )
        .toString()
        .trim()
      newVersion = `${process.env['INPUT_TAG-PREFIX']}${newVersion}`
      console.log('new version:', newVersion)
      try {
        // to support "actions/checkout@v1"
        await tools.runInWorkspace('git', [
          'commit',
          '-a',
          '-m',
          `ci: ${commitMessage} ${newVersion}`
        ])
      } catch (e) {
        console.warn(
          'git commit failed because you are using "actions/checkout@v2"; ' +
            'but that doesnt matter because you dont need that git commit, thats only for "actions/checkout@v1"'
        )
      }
    } else {
      await tools.runInWorkspace('git', ['checkout', currentBranch])
      await tools.runInWorkspace('yarn', [
        'version',
        '--no-git-tag-version',
        current
      ])
      console.log('current:', current, '/', 'version:', version)
      newVersion = execSync(`yarn version --no-git-tag-version ${version}`)
        .toString()
        .trim()
      newVersion = `${process.env['INPUT_TAG-PREFIX']}${newVersion}`
      console.log('new version:', newVersion)
      try {
        // to support "actions/checkout@v1"
        await tools.runInWorkspace('git', [
          'commit',
          '-a',
          '-m',
          `ci: ${commitMessage} ${newVersion}`
        ])
      } catch (e) {
        console.warn(
          'git commit failed because you are using "actions/checkout@v2"; ' +
            'but that doesnt matter because you dont need that git commit, thats only for "actions/checkout@v1"'
        )
      }
    }

    const remoteRepo = `https://${process.env.GITHUB_ACTOR}:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`
    // console.log(Buffer.from(remoteRepo).toString('base64'))
    await tools.runInWorkspace('git', ['tag', newVersion])
    await tools.runInWorkspace('git', ['push', remoteRepo, '--follow-tags'])
    await tools.runInWorkspace('git', ['push', remoteRepo, '--tags'])
  } catch (e) {
    tools.log.fatal(e)
    tools.exit.failure('Failed to bump version')
  }
  tools.exit.success('Version bumped!')
})
