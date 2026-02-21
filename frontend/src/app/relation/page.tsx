import Image from 'next/image'
import { promises as fs } from 'fs'
import path from 'path'

export function setUpImage(name: string) {
  return <Image src={name} alt={'something'} />
}
export default async function Page() {
  let filenames: string[] = []
  const directoryPath = path.join(process.cwd(), 'public/assets/level1/relation1-1');
  try {
    filenames = await fs.readdir(directoryPath);
    console.log(filenames)
  } catch (err) {
    console.log(err)
  }

  let leftElement: string[] = []
  let rightElement: string[] = []
  for (let i = 0; i < filenames.length; i++) {
    const name: string = filenames[i];
    if (name.startsWith("left")) {
      leftElement.push(name)
    } else {
      rightElement.push(name)
    }
  }

  return (
    <div className="grid-rows-4 gap-4">
      {leftElement.map(function(name) {
        return (
          <Image
            key={name}
            src={`/assets/level1/relation1-1/${name}`}
            alt={name}
            width={300}
            height={300}
          />
        )
      })}
    </div>
  );
}
