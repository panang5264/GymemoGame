'use client'

import { useState } from 'react'
import Image from 'next/image'

interface IImage {
  name: string
  is_selected: boolean
}
export default function ClientPage({ filenames }: { filenames: string[] }) {
  const [selected, setSelected] = useState<IImage>({
    name: "",
    is_selected: false
  })

  return (
    <div className="grid grid-rows-4 gap-4 px-30">
      {filenames.map((name) => (
        <Image
          key={name}
          onClick={function() {
            if (selected.name != name) {
              setSelected({ name: name, is_selected: true })
            } else {
              const isCurrentSelected = selected.is_selected
              setSelected({ ...selected, is_selected: !isCurrentSelected })
            }
          }}
          className={`cursor-pointer border-4 ${(selected.is_selected === true && selected.name === name) ? 'border-red-500' : 'border-transparent'
            }`}
          src={`/assets/level1/relation1-1/${name}`}
          alt={name}
          width={150}
          height={150}
        />
      ))}
    </div>
  )
}
