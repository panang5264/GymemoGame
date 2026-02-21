"use client"
import Image from 'next/image'
import react from 'react'
import * as game from './game_logic'


export default function ClientPage({ question }: { question: string }) {
  const [image_width, image_height] = [300, 300]
  const path = '/assets/FindObject1/'
  const leftImageName = 'image1.png'
  const rightImageName = 'image2.png'
  const [selected, setSelected] = react.useState<string | null>()
  const [is_corrected, setIsCorrected] = react.useState<boolean | null>(null)

  const changeSelectedImage = function(name: string) {
    if (!selected) {
      setSelected(name)
    } else if (selected === name) {
      setSelected(null)
    } else {
      setSelected(name)
    }
  }

  // NOTE: For Debugging
  const showMessage = function() {
    if (is_corrected == null) {
      return
    }
    if (is_corrected) {
      return "✅ ถูกต้อง"
    } else {
      return "❌ ไม่ถูกต้อง"
    }
  }

  const setElemBorder = function(elemName: string) {
    if (elemName !== selected || !selected) {
      return 'border-transparent'
    }
    if (is_corrected != null) {
      if (is_corrected) {
        return "border-green-500"
      }
    }

    if (elemName === selected) {
      return 'border-red-500'
    }
  }
  return (
    <div>
      <div className='flex justify-center gap-8 mt-10 mb-10'>
        <Image
          src={path + leftImageName}
          className={`border-4 ${setElemBorder(leftImageName)}`}
          onClick={function() {
            changeSelectedImage(leftImageName)
            const t = game.checkAnswer("left", question)
            setIsCorrected(t)
            console.log(t)
          }}
          width={image_width}
          height={image_height}
          alt={''}
        />
        <Image
          src={path + rightImageName}
          onClick={function() {
            changeSelectedImage(rightImageName)
            const t = game.checkAnswer("right", question)
            setIsCorrected(t)
            console.log(t)
          }}
          className={`border-4 ${setElemBorder(rightImageName)}`}
          width={image_width}
          height={image_height}
          alt={''}
        />
      </div>
      <div className='flex justify-center'>
        <p>
          {question}
        </p>
      </div>
      <div className='flex justify-center'>
        <p>
          {showMessage()}
        </p>
      </div>
    </div>
  )
}
