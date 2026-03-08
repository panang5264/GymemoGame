export const AVATARS = [
    { id: 'avatar-1', imagePath: '/assets_employer/profiles/base/IMG_0857.PNG', label: 'ผู้เล่นธรรมดา 1' },
    { id: 'avatar-2', imagePath: '/assets_employer/profiles/base/IMG_0858.PNG', label: 'ผู้เล่นธรรมดา 2' },
    { id: 'avatar-3', imagePath: '/assets_employer/profiles/glasses/IMG_0868.PNG', label: 'ใส่แว่น 1' },
    { id: 'avatar-4', imagePath: '/assets_employer/profiles/glasses/IMG_0869.PNG', label: 'ใส่แว่น 2' },
    { id: 'avatar-5', imagePath: '/assets_employer/profiles/traditional/IMG_0877.PNG', label: 'ชุดพื้นเมือง 1' },
    { id: 'avatar-6', imagePath: '/assets_employer/profiles/traditional/IMG_0878.PNG', label: 'ชุดพื้นเมือง 2' },
    { id: 'avatar-7', imagePath: '/assets_employer/profiles/glasses-traditional/IMG_0887.PNG', label: 'แว่น+พื้นเมือง 1' },
    { id: 'avatar-8', imagePath: '/assets_employer/profiles/glasses-traditional/IMG_0888.PNG', label: 'แว่น+พื้นเมือง 2' },
]

export function getAvatarPath(id: string | undefined): string {
    if (!id) return AVATARS[0].imagePath
    const found = AVATARS.find(a => a.id === id)
    return found ? found.imagePath : AVATARS[0].imagePath
}
