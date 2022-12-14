import pu from 'tcp-port-used'

export default async function nextAvailablePort() {
  let port = 3000
  let free = false
  let inUse: number[] = []
  while ((free = await pu.check(port, '127.0.0.1'))) {
    inUse.push(port)
    port++
  }
  if (inUse.length > 0) console.log(`Ports ${inUse} ${inUse.length == 1 ? 'is' : 'are'} in use`)
  return port
}
