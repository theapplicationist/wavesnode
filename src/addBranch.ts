import { BlockStorage } from "./BlockStorage";

async function main() {
  const h = Math.round(Math.random() * 50)
  const l = Math.round(Math.random() * 10) + 2
  const height = await BlockStorage.getHeight() - h
  BlockStorage.addBranch(height, l)
}

main()
