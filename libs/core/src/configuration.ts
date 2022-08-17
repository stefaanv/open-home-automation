import { readFile, readdir } from 'fs/promises'
import { join } from 'path'

const MAIN_CONFIG_FILENAME = 'config.json'
const CONFIG_FOLDER = '../../../configuration'

export default async () => {
  const content = await readFile(join(__dirname, CONFIG_FOLDER, MAIN_CONFIG_FILENAME), { encoding: 'utf-8' })
  const configuration = JSON.parse(content)

  const files = await readdir(join(__dirname, CONFIG_FOLDER))
  for await (const file of files.filter(f => !f.startsWith('config'))) {
    const content = await readFile(join(__dirname, CONFIG_FOLDER, file), { encoding: 'utf-8' })
    const application = file.replace('.json', '')
    configuration[application] = JSON.parse(content)
  }
  console.log(configuration)
  return configuration
}
