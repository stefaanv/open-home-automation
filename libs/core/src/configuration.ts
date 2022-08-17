import { readFileSync } from 'fs'
import { join } from 'path'

const CONFIG_FILENAME = '../../../config.json'

export default () => {
  return JSON.parse(readFileSync(join(__dirname, CONFIG_FILENAME), 'utf8')) as Record<string, any>
}
